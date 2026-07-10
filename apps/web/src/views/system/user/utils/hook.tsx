import "./reset.css";
import dayjs from "dayjs";
import roleForm from "../form/role.vue";
import editForm from "../form/index.vue";
import { zxcvbn } from "@zxcvbn-ts/core";
import { message } from "@/utils/message";
import userAvatar from "@/assets/user.jpg";
import { usePublicHooks } from "../../hooks";
import { addDialog } from "@/components/ReDialog";
import type { PaginationProps } from "@pureadmin/table";
import ReCropperPreview from "@/components/ReCropperPreview";
import type { FormItemProps, RoleFormItemProps } from "../utils/types";
import {
  getKeyList,
  isAllEmpty,
  hideTextAtIndex,
  deviceDetection,
} from "@pureadmin/utils";
import { getRoleIds, getUserList, getAllRoleList, createUser, updateUser, deleteUser, batchDeleteUser, resetPassword } from "@/api/system";
import {
  ElForm,
  ElInput,
  ElFormItem,
  ElProgress,
  ElMessageBox,
} from "element-plus";
import {
  type Ref,
  h,
  ref,
  toRaw,
  watch,
  computed,
  reactive,
  onMounted,
} from "vue";

export function useUser(tableRef: Ref) {
  const form = reactive({
    username: "",
    email: "",
    status: "",
  });
  const formRef = ref();
  const ruleFormRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  // 上传头像信息
  const avatarInfo = ref();
  const switchLoadMap = ref({});
  const { switchStyle } = usePublicHooks();
  const selectedNum = ref(0);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true,
  });
  const columns: TableColumnList = [
    {
      label: "勾选列", // 如果需要表格多选，此处label必须设置
      type: "selection",
      fixed: "left",
      reserveSelection: true, // 数据刷新后保留选项
    },
    {
      label: "用户ID",
      prop: "id",
      width: 90,
    },
    {
      label: "用户头像",
      prop: "avatar",
      cellRenderer: ({ row }) => (
        <el-image
          fit="cover"
          preview-teleported={true}
          src={row.avatar || userAvatar}
          preview-src-list={Array.of(row.avatar || userAvatar)}
          class="size-6 rounded-full align-middle"
        />
      ),
      width: 90,
    },
    {
      label: "用户名称",
      prop: "username",
      minWidth: 130,
    },
    {
      label: "性别",
      prop: "sex",
      minWidth: 90,
      cellRenderer: ({ row, props }) => (
        <el-tag
          size={props.size}
          type={row.sex === 1 ? "danger" : null}
          effect="plain"
        >
          {row.sex === 1 ? "女" : "男"}
        </el-tag>
      ),
    },
    {},
    {
      label: "邮箱",
      prop: "email",
      minWidth: 150,
    },
    {
      label: "角色",
      prop: "roles",
      minWidth: 120,
      cellRenderer: ({ row }) => {
        const roles = row.roles || [];
        if (!roles.length) return <el-tag type="info" size="small">未分配</el-tag>;
        const visible = roles.slice(0, 2);
        const rest = roles.slice(2);
        return (
          <span>
            {visible.map(r => <el-tag class="mr-1" size="small">{r}</el-tag>)}
            {rest.length > 0 && (
              <el-tooltip content={rest.join('、')} placement="top">
                <el-tag size="small">+{rest.length}</el-tag>
              </el-tooltip>
            )}
          </span>
        );
      },
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 90,
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
    },
    {
      label: "创建时间",
      minWidth: 90,
      prop: "createTime",
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      label: "操作",
      fixed: "right",
      width: 180,
      slot: "operation",
    },
  ];
  const buttonClass = computed(() => {
    return [
      "h-5!",
      "reset-margin",
      "text-gray-500!",
      "dark:text-white!",
      "dark:hover:text-primary!",
    ];
  });
  // 重置的新密码
  const pwdForm = reactive({
    newPwd: "",
  });
  const pwdProgress = [
    { color: "#e74242", text: "非常弱" },
    { color: "#EFBD47", text: "弱" },
    { color: "#ffa500", text: "一般" },
    { color: "#1bbf1b", text: "强" },
    { color: "#008000", text: "非常强" },
  ];
  // 当前密码强度（0-4）
  const curScore = ref();
  const roleOptions = ref([]);

  async function onChange({ row, index }) {
    try {
      await ElMessageBox.confirm(
        `确认要<strong>${
          row.status === 0 ? "停用" : "启用"
        }</strong><strong style='color:var(--el-color-primary)'>${
          row.username
        }</strong>用户吗?`,
        "系统提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          dangerouslyUseHTMLString: true,
          draggable: true,
        },
      );
    } catch {
      row.status === 0 ? (row.status = 1) : (row.status = 0);
      return;
    }

    switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: true };
    const { code } = await updateUser({ id: row.id, status: row.status });
    switchLoadMap.value[index] = { ...switchLoadMap.value[index], loading: false };
    if (code === 0) {
      message("已成功修改用户状态", { type: "success" });
    } else {
      row.status === 0 ? (row.status = 1) : (row.status = 0);
    }
  }

  function handleUpdate(row) {
    console.log(row);
  }

  async function handleDelete(row) {
    const { code } = await deleteUser({ id: row.id });
    if (code === 0) {
      message(`已删除用户 ${row.username}`, { type: "success" });
      onSearch();
    }
  }

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    onSearch();
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  /** 当CheckBox选择项发生变化时会触发该事件 */
  function handleSelectionChange(val) {
    selectedNum.value = val.length;
    // 重置表格高度
    tableRef.value.setAdaptive();
  }

  /** 取消选择 */
  function onSelectionCancel() {
    selectedNum.value = 0;
    // 用于多选表格，清空用户的选择
    tableRef.value.getTableRef().clearSelection();
  }

  /** 批量删除 */
  async function onbatchDel() {
    const curSelected = tableRef.value.getTableRef().getSelectionRows();
    const ids = getKeyList(curSelected, "id");
    if (!ids.length) return message("请先选择要删除的用户", { type: "warning" });
    const { code } = await batchDeleteUser({ ids });
    if (code === 0) {
      message(`已删除 ${ids.length} 个用户`, { type: "success" });
      tableRef.value.getTableRef().clearSelection();
      onSearch();
    }
  }

  async function onSearch() {
    loading.value = true;
    const { code, data } = await getUserList({ ...toRaw(form), pageNum: pagination.currentPage, pageSize: pagination.pageSize });
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
      title: `${title}用户`,
      props: {
        formInline: {
          title,
          id: row?.id ?? null,
          username: row?.username ?? "",
          password: row?.password ?? "",
          email: row?.email ?? "",
          sex: row?.sex ?? "",
          roleIds: row?.roleIds ?? (title === '新增' ? [2] : undefined),
          status: row?.status ?? 1,
          remark: row?.remark ?? "",
        },
      },
      width: "46%",
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
              const { code, message: msg } = await createUser(curData);
              if (code !== 0) {
                message(msg || '创建失败', { type: "error" });
                return;
              }
              message(`已新增用户 ${curData.username}`, { type: "success" });
            } else {
              const { code, message: msg } = await updateUser({ id: curData.id, ...curData });
              if (code !== 0) {
                message(msg || '修改失败', { type: "error" });
                return;
              }
              message(`已修改用户 ${curData.username}`, { type: "success" });
            }
            done();
            onSearch();
          }
        });
      },
    });
  }

  const cropRef = ref();
  /** 上传头像 */
  function handleUpload(row) {
    addDialog({
      title: "裁剪、上传头像",
      width: "40%",
      closeOnClickModal: false,
      fullscreen: deviceDetection(),
      contentRenderer: () =>
        h(ReCropperPreview, {
          ref: cropRef,
          imgSrc: row.avatar || userAvatar,
          onCropper: (info) => (avatarInfo.value = info),
        }),
      beforeSure: (done) => {
        console.log("裁剪后的图片信息：", avatarInfo.value);
        // 根据实际业务使用avatarInfo.value和row里的某些字段去调用上传头像接口即可
        done(); // 关闭弹框
        onSearch(); // 刷新表格数据
      },
      closeCallBack: () => cropRef.value.hidePopover(),
    });
  }

  watch(
    pwdForm,
    ({ newPwd }) =>
      (curScore.value = isAllEmpty(newPwd) ? -1 : zxcvbn(newPwd).score),
  );

  /** 重置密码 */
  function handleReset(row) {
    addDialog({
      title: `重置 ${row.username} 用户的密码`,
      width: "30%",
      draggable: true,
      closeOnClickModal: false,
      fullscreen: deviceDetection(),
      contentRenderer: () => (
        <>
          <ElForm ref={ruleFormRef} model={pwdForm}>
            <ElFormItem
              prop="newPwd"
              rules={[
                {
                  required: true,
                  message: "请输入新密码",
                  trigger: "blur",
                },
              ]}
            >
              <ElInput
                clearable
                show-password
                type="password"
                v-model={pwdForm.newPwd}
                placeholder="请输入新密码"
              />
            </ElFormItem>
          </ElForm>
          <div class="my-4 flex">
            {pwdProgress.map(({ color, text }, idx) => (
              <div
                class="w-[19vw]"
                style={{ marginLeft: idx !== 0 ? "4px" : 0 }}
              >
                <ElProgress
                  striped
                  striped-flow
                  duration={curScore.value === idx ? 6 : 0}
                  percentage={curScore.value >= idx ? 100 : 0}
                  color={color}
                  stroke-width={10}
                  show-text={false}
                />
                <p
                  class="text-center"
                  style={{ color: curScore.value === idx ? color : "" }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </>
      ),
      closeCallBack: () => (pwdForm.newPwd = ""),
      beforeSure: async (done) => {
        ruleFormRef.value.validate(async (valid) => {
          if (valid) {
            const { code, message: msg } = await resetPassword({ id: row.id, password: pwdForm.newPwd });
            if (code !== 0) {
              message(msg || '重置失败', { type: "error" });
              return;
            }
            message(`已成功重置 ${row.username} 用户的密码`, { type: "success" });
            done();
            onSearch();
          }
        });
      },
    });
  }

  /** 分配角色 */
  async function handleRole(row) {
    // 选中的角色列表
    const ids = (await getRoleIds({ userId: row.id })).data ?? [];
    addDialog({
      title: `分配 ${row.username} 用户的角色`,
      props: {
        formInline: {
          username: row?.username ?? "",
          nickname: row?.nickname ?? "",
          roleOptions: roleOptions.value ?? [],
          ids,
        },
      },
      width: "400px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(roleForm),
      beforeSure: (done, { options }) => {
        const curData = options.props.formInline as RoleFormItemProps;
        console.log("curIds", curData.ids);
        // 根据实际业务使用curData.ids和row里的某些字段去调用修改角色接口即可
        done(); // 关闭弹框
      },
    });
  }

  onMounted(async () => {
    onSearch();

    // 角色列表
    roleOptions.value = (await getAllRoleList()).data ?? [];
  });

  return {
    form,
    loading,
    columns,
    dataList,
    selectedNum,
    pagination,
    buttonClass,
    deviceDetection,
    onSearch,
    resetForm,
    onbatchDel,
    openDialog,
    handleUpdate,
    handleDelete,
    handleUpload,
    handleReset,
    handleRole,
    handleSizeChange,
    onSelectionCancel,
    handleCurrentChange,
    handleSelectionChange,
  };
}
