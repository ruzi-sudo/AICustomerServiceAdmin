import dayjs from "dayjs";
import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { usePublicHooks } from "../../hooks";
import { transformI18n } from "@/plugins/i18n";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { getKeyList, deviceDetection } from "@pureadmin/utils";
import { getRoleList, getRoleMenu, getRoleMenuIds, createRole, updateRole, deleteRole, saveRoleMenu } from "@/api/system";
import { type Ref, reactive, ref, onMounted, h, toRaw, watch } from "vue";

export function useRole(treeRef: Ref) {
  const form = reactive({
    name: "",
    code: "",
    status: "",
  });
  const curRow = ref();
  const formRef = ref();
  const dataList = ref([]);
  const treeIds = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const switchLoadMap = ref({});
  const isExpandAll = ref(false);
  const isSelectAll = ref(false);
  const { switchStyle } = usePublicHooks();
  const treeProps = {
    value: "id",
    label: "title",
    children: "children",
  };
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true,
  });
  const columns: TableColumnList = [
    {
      label: "角色编号",
      prop: "id",
    },
    {
      label: "角色名称",
      prop: "name",
    },
    {
      label: "角色标识",
      prop: "code",
    },
    {
      label: "状态",
      cellRenderer: (scope) => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          active-value={1}
          inactive-value={0}
          active-text="已启用"
          inactive-text="已停用"
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
      ),
      minWidth: 90,
    },
    {
      label: "备注",
      prop: "remark",
      minWidth: 160,
    },
    {
      label: "创建时间",
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation",
    },
  ];
  // const buttonClass = computed(() => {
  //   return [
  //     "h-5!",
  //     "reset-margin",
  //     "text-gray-500!",
  //     "dark:text-white!",
  //     "dark:hover:text-primary!"
  //   ];
  // });

  async function onChange({ row, index }) {
    try {
      await ElMessageBox.confirm(
        `确认要<strong>${row.status === 0 ? "停用" : "启用"}</strong><strong style='color:var(--el-color-primary)'>${row.name}</strong>吗?`,
        "系统提示",
        { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning", dangerouslyUseHTMLString: true, draggable: true },
      );
    } catch {
      row.status === 0 ? (row.status = 1) : (row.status = 0);
      return;
    }
    switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: true };
    const { code } = await updateRole({ id: row.id, status: row.status });
    switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: false };
    if (code === 0) {
      message(`已${row.status === 0 ? "停用" : "启用"}${row.name}`, { type: "success" });
    } else {
      row.status === 0 ? (row.status = 1) : (row.status = 0);
    }
  }

  async function handleDelete(row) {
    const { code, message: msg } = await deleteRole({ id: row.id });
    if (code === 0) {
      message(`已删除角色 ${row.name}`, { type: "success" });
      onSearch();
    } else {
      message(msg || '删除失败', { type: "error" });
    }
  }

  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  async function onSearch() {
    loading.value = true;
    const { code, data } = await getRoleList(toRaw(form));
    if (code === 0) {
      dataList.value = data.list;
      pagination.total = data.total;
      pagination.pageSize = data.pageSize;
      pagination.currentPage = data.currentPage;
    }

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  const resetForm = (formEl) => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}角色`,
      props: {
        formInline: {
          id: row?.id ?? null,
          name: row?.name ?? "",
          code: row?.code ?? "",
          remark: row?.remark ?? "",
        },
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: async (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        FormRef.validate(async (valid) => {
          if (valid) {
            if (title === "新增") {
              const { code, message: msg } = await createRole(curData);
              if (code !== 0) { message(msg || '创建失败', { type: "error" }); return; }
              message(`已新增角色 ${curData.name}`, { type: "success" });
            } else {
              const { code, message: msg } = await updateRole({ id: curData.id, ...curData });
              if (code !== 0) { message(msg || '修改失败', { type: "error" }); return; }
              message(`已修改角色 ${curData.name}`, { type: "success" });
            }
            done();
            onSearch();
          }
        });
      },
    });
  }

  /** 菜单权限 */
  async function handleMenu(row?: any) {
    const { id } = row;
    if (id) {
      curRow.value = row;
      isShow.value = true;
      const { code, data } = await getRoleMenuIds({ id });
      if (code === 0) {
        treeRef.value.setCheckedKeys(data);
      }
    } else {
      curRow.value = null;
      isShow.value = false;
    }
  }

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : "",
    };
  }

  /** 菜单权限-保存 */
  async function handleSave() {
    const { id, name } = curRow.value;
    const menuIds = treeRef.value.getCheckedKeys();
    const { code, message: msg } = await saveRoleMenu({ id, menuIds });
    if (code === 0) {
      message(`角色 ${name} 的菜单权限修改成功`, { type: "success" });
    } else {
      message(msg || '保存失败', { type: "error" });
    }
  }

  /** 数据权限 可自行开发 */
  // function handleDatabase() {}

  const onQueryChanged = (query: string) => {
    treeRef.value!.filter(query);
  };

  const filterMethod = (query: string, node) => {
    return transformI18n(node.title)!.includes(query);
  };

  onMounted(async () => {
    onSearch();
    const { code, data } = await getRoleMenu();
    if (code === 0) {
      treeIds.value = getKeyList(data, "id");
      treeData.value = handleTree(data);
    }
  });

  watch(isExpandAll, (val) => {
    val
      ? treeRef.value.setExpandedKeys(treeIds.value)
      : treeRef.value.setExpandedKeys([]);
  });

  watch(isSelectAll, (val) => {
    val
      ? treeRef.value.setCheckedKeys(treeIds.value)
      : treeRef.value.setCheckedKeys([]);
  });

  return {
    form,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    treeData,
    treeProps,
    isLinkage,
    pagination,
    isExpandAll,
    isSelectAll,
    treeSearchValue,
    // buttonClass,
    onSearch,
    resetForm,
    openDialog,
    handleMenu,
    handleSave,
    handleDelete,
    filterMethod,
    transformI18n,
    onQueryChanged,
    // handleDatabase,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange,
  };
}
