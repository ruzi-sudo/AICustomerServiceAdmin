import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { isEmail } from "@pureadmin/utils";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  username: [{ required: true, message: "用户名称为必填项", trigger: "blur" }],
  password: [{ required: true, message: "用户密码为必填项", trigger: "blur" }],
  email: [
    { required: true, message: "邮箱为必填项", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (!isEmail(value)) {
          callback(new Error("请输入正确的邮箱格式"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
});
