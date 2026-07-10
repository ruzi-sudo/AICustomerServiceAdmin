import dayjs from "dayjs";
import { message } from "@/utils/message";
import { getKeyList } from "@pureadmin/utils";
import { getLoginLogsList, deleteLoginLogs, clearLoginLogs } from "@/api/system";
import { usePublicHooks } from "@/views/system/hooks";
import type { PaginationProps } from "@pureadmin/table";
import { type Ref, reactive, ref, onMounted, toRaw } from "vue";

export function useRole(tableRef: Ref) {
  const form = reactive({
    username: "",
    status: "",
    loginTime: "",
  });
  const dataList = ref([]);
  const loading = ref(true);
  const selectedNum = ref(0);
  const { tagStyle } = usePublicHooks();

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
      label: "序号",
      prop: "id",
      minWidth: 70,
    },
    {
      label: "用户ID",
      prop: "userId",
      minWidth: 70,
    },
    {
      label: "用户名",
      prop: "username",
      minWidth: 100,
    },
    {
      label: "登录 IP",
      prop: "ip",
      minWidth: 140,
    },
    {
      label: "登录地点",
      prop: "address",
      minWidth: 140,
    },
    {
      label: "操作系统",
      prop: "system",
      minWidth: 100,
    },
    {
      label: "浏览器类型",
      prop: "browser",
      minWidth: 100,
    },
    {
      label: "登录状态",
      prop: "status",
      minWidth: 100,
      cellRenderer: ({ row, props }) => (
        <el-tag size={props.size} style={tagStyle.value(row.status)}>
          {row.status === 1 ? "成功" : "失败"}
        </el-tag>
      ),
    },
    {
      label: "登录行为",
      prop: "behavior",
      minWidth: 100,
    },
    {
      label: "登录时间",
      prop: "loginTime",
      minWidth: 180,
      formatter: ({ loginTime }) =>
        dayjs(loginTime).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

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
    if (!ids.length) return message("请先选择要删除的日志", { type: "warning" });
    const { code } = await deleteLoginLogs({ ids });
    if (code === 0) {
      message(`已删除 ${ids.length} 条日志`, { type: "success" });
      tableRef.value.getTableRef().clearSelection();
      onSearch();
    }
  }

  /** 清空日志 */
  async function clearAll() {
    const { code } = await clearLoginLogs();
    if (code === 0) {
      message("已清空所有登录日志", { type: "success" });
      onSearch();
    }
  }

  async function onSearch() {
    loading.value = true;
    const { code, data } = await getLoginLogsList({ ...toRaw(form), pageNum: pagination.currentPage, pageSize: pagination.pageSize });
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

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    selectedNum,
    onSearch,
    clearAll,
    resetForm,
    onbatchDel,
    handleSizeChange,
    onSelectionCancel,
    handleCurrentChange,
    handleSelectionChange,
  };
}
