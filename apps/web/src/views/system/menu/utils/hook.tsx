import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { message } from "@/utils/message";
import { getMenuList, createMenu, updateMenu, deleteMenu } from "@/api/system";
import { transformI18n } from "@/plugins/i18n";
import { addDialog } from "@/components/ReDialog";
import { reactive, ref, onMounted, h } from "vue";
import type { FormItemProps } from "../utils/types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { cloneDeep, isAllEmpty, deviceDetection } from "@pureadmin/utils";
import { usePublicHooks } from "../../hooks";

export function useMenu() {
  const form = reactive({
    title: "",
  });

  const formRef = ref();
  const dataList = ref([]);
  const flatMenuList = ref([]);
  const loading = ref(true);
  const switchLoadMap = ref<Record<number, { loading: boolean }>>({});
  const { switchStyle } = usePublicHooks();

  const getMenuType = (type, text = false) => {
    switch (type) {
      case 0:
        return text ? "菜单" : "primary";
      case 1:
        return text ? "按钮" : "info";
    }
  };

  const columns: TableColumnList = [
    {
      label: "菜单名称",
      prop: "title",
      align: "left",
      cellRenderer: ({ row }) => (
        <>
          <span class="inline-block mr-1">
            {h(useRenderIcon(row.icon), {
              style: { paddingTop: "1px" },
            })}
          </span>
          <span>{transformI18n(row.title)}</span>
        </>
      ),
    },
    {
      label: "菜单类型",
      prop: "menuType",
      width: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={getMenuType(row.menuType) as any}
          effect="plain"
        >
          {getMenuType(row.menuType, true)}
        </el-tag>
      ),
    },
    {
      label: "路由路径",
      prop: "path",
    },
    {
      label: "组件路径",
      prop: "component",
      formatter: ({ path, component }) =>
        isAllEmpty(component) ? path : component,
    },
    {
      label: "权限标识",
      prop: "auths",
    },
    {
      label: "排序",
      prop: "rank",
      width: 100,
    },
    {
      label: "隐藏",
      prop: "showLink",
      formatter: ({ showLink }) => (showLink ? "否" : "是"),
      width: 100,
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      cellRenderer: (scope) => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.row.id]?.loading}
          modelValue={scope.row.status}
          activeValue={1}
          inactiveValue={0}
          active-text="启用"
          inactive-text="停用"
          style={switchStyle}
          onChange={(value: number) =>
            handleStatusChange(scope.row, scope.index, value)
          }
        />
      ),
    },
    {
      label: "操作",
      fixed: "right",
      width: 210,
      slot: "operation",
    },
  ];

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { code, data } = await getMenuList(); // 这里是返回一维数组结构，前端自行处理成树结构，返回格式要求：唯一id加父节点parentId，parentId取父节点id
    if (code === 0) {
      flatMenuList.value = data;
      let newData = data;
      if (!isAllEmpty(form.title)) {
        newData = filterMenusWithAncestors(newData, form.title);
      }
      dataList.value = handleTree(newData); // 处理成树结构
    }

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  function filterMenusWithAncestors(list, keyword: string) {
    const menuMap = new Map(list.map(item => [item.id, item]));
    const includeIds = new Set<number>();
    for (const item of list) {
      if (!transformI18n(item.title).includes(keyword)) continue;
      let current = item;
      while (current) {
        includeIds.add(current.id);
        current = menuMap.get(current.parentId);
      }
    }
    return list.filter(item => includeIds.has(item.id));
  }

  function formatHigherMenuOptions(treeList, currentId?: number) {
    if (!treeList || !treeList.length) return;
    const newTreeList = [];
    for (let i = 0; i < treeList.length; i++) {
      if (treeList[i].menuType === 1 || treeList[i].id === currentId) continue;
      treeList[i].title = transformI18n(treeList[i].title);
      treeList[i].children = formatHigherMenuOptions(treeList[i].children, currentId);
      newTreeList.push(treeList[i]);
    }
    return newTreeList;
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}菜单`,
      props: {
        formInline: {
          id: row?.id ?? null,
          menuType: row?.menuType ?? 0,
          higherMenuOptions: formatHigherMenuOptions(handleTree(cloneDeep(flatMenuList.value)), row?.id),
          parentId: row?.parentId ?? 0,
          title: row?.title ?? "",
          name: row?.name ?? "",
          path: row?.path ?? "",
          component: row?.component ?? "",
          rank: row?.rank ?? 99,
          redirect: row?.redirect ?? "",
          icon: row?.icon ?? "",
          extraIcon: row?.extraIcon ?? "",
          enterTransition: row?.enterTransition ?? "",
          leaveTransition: row?.leaveTransition ?? "",
          activePath: row?.activePath ?? "",
          auths: row?.auths ?? "",
          keepAlive: row?.keepAlive ?? false,
          hiddenTag: row?.hiddenTag ?? false,
          fixedTag: row?.fixedTag ?? false,
          showLink: row?.showLink ?? true,
          showParent: row?.showParent ?? false,
          status: row?.status ?? 1,
        },
      },
      width: "45%",
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
              const { code, message: msg } = await createMenu(curData);
              if (code !== 0) { message(msg || '创建失败', { type: "error" }); return; }
              message(`已新增菜单 ${transformI18n(curData.title)}`, { type: "success" });
            } else {
              const { code, message: msg } = await updateMenu({ id: row?.id, ...curData });
              if (code !== 0) { message(msg || '修改失败', { type: "error" }); return; }
              message(`已修改菜单 ${transformI18n(curData.title)}`, { type: "success" });
            }
            done();
            onSearch();
          }
        });
      },
    });
  }

  async function handleDelete(row) {
    const { code, message: msg } = await deleteMenu({ id: row.id });
    if (code === 0) {
      message(`已删除菜单 ${transformI18n(row.title)}`, { type: "success" });
      onSearch();
    } else {
      message(msg || '删除失败', { type: "error" });
    }
  }

  async function handleStatusChange(row, index, value: number) {
    const oldStatus = row.status;
    const newStatus = Number(value);
    switchLoadMap.value[row.id] = { loading: true };
    const { code, message: msg } = await updateMenu({ id: row.id, status: newStatus });
    if (code === 0) {
      row.status = newStatus;
      message(newStatus === 1 ? '已启用' : '已停用', { type: "success" });
    } else {
      row.status = oldStatus;
      message(msg || '操作失败', { type: "error" });
    }
    switchLoadMap.value[row.id] = { loading: false };
  }

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    /** 搜索 */
    onSearch,
    /** 重置 */
    resetForm,
    /** 新增、修改菜单 */
    openDialog,
    /** 删除菜单 */
    handleDelete,
  };
}
