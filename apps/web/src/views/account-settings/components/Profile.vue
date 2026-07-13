<script setup lang="ts">
import { message } from "@/utils/message";
import { onMounted, reactive, ref } from "vue";
import { type UserInfo, getMine, uploadAvatar } from "@/api/user";
import {
  getAllRoleList,
  resetPassword,
  updateUser,
} from "@/api/system";
import type { FormInstance, FormRules } from "element-plus";
import ReCropperPreview from "@/components/ReCropperPreview";
import { createFormData, deviceDetection } from "@pureadmin/utils";
import uploadLine from "~icons/ri/upload-line";

defineOptions({
  name: "Profile",
});

const imgSrc = ref("");
const cropperBlob = ref();
const cropRef = ref();
const uploadRef = ref();
const isShow = ref(false);
const passwordDialogVisible = ref(false);
const userInfoFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const roleOptions = ref<{ id: number; name: string }[]>([]);

const userInfos = reactive({
  id: null as number | null,
  avatar: "",
  username: "",
  email: "",
  roleIds: [] as number[],
  status: 1,
  remark: "",
  description: "",
});

const passwordForm = reactive({
  password: "",
  confirmPassword: "",
});

const rules = reactive<FormRules<UserInfo & { id: number | null }>>({
  username: [{ required: true, message: "用户名必填", trigger: "blur" }],
  email: [
    { required: true, message: "邮箱必填", trigger: "blur" },
    { type: "email", message: "邮箱格式不正确", trigger: ["blur", "change"] },
  ],
  roleIds: [{ required: true, message: "请选择角色", trigger: "change" }],
});

const passwordRules = reactive<FormRules>({
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.password) {
          callback(new Error("两次输入的密码不一致"));
          return;
        }
        callback();
      },
      trigger: ["blur", "change"],
    },
  ],
});

const onChange = (uploadFile) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    imgSrc.value = e.target.result as string;
    isShow.value = true;
  };
  reader.readAsDataURL(uploadFile.raw);
};

const handleClose = () => {
  cropRef.value.hidePopover();
  uploadRef.value.clearFiles();
  isShow.value = false;
};

const onCropper = ({ blob }) => (cropperBlob.value = blob);

const handleSubmitImage = async () => {
  if (!userInfos.id) return;
  const formData = createFormData({
    file: new File([cropperBlob.value], "avatar.png", { type: "image/png" }),
  });
  try {
    const { code, data, message: msg } = await uploadAvatar(formData);
    if (code !== 0) {
      message(msg || "上传头像失败", { type: "error" });
      return;
    }
    const avatar = data?.url;
    const result = await updateUser({ id: userInfos.id, avatar });
    if (result.code !== 0) {
      message(result.message || "更新头像失败", { type: "error" });
      return;
    }
    userInfos.avatar = avatar;
    message("更新头像成功", { type: "success" });
    handleClose();
  } catch (error) {
    message(`提交异常 ${error}`, { type: "error" });
  }
};

// 更新信息
const onSubmit = async (formEl: FormInstance) => {
  if (!userInfos.id) return;
  await formEl.validate(async (valid) => {
    if (valid) {
      const { code, message: msg } = await updateUser({
        id: userInfos.id,
        username: userInfos.username,
        email: userInfos.email,
        roleIds: userInfos.roleIds,
        status: userInfos.status,
        remark: userInfos.remark || userInfos.description,
      });
      if (code !== 0) {
        message(msg || "更新信息失败", { type: "error" });
        return;
      }
      message("更新信息成功", { type: "success" });
    }
  });
};

const openPasswordDialog = () => {
  passwordForm.password = "";
  passwordForm.confirmPassword = "";
  passwordDialogVisible.value = true;
};

const handleResetPassword = async () => {
  if (!userInfos.id || !passwordFormRef.value) return;
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return;
    const { code, message: msg } = await resetPassword({
      id: userInfos.id,
      password: passwordForm.password,
    });
    if (code !== 0) {
      message(msg || "重置密码失败", { type: "error" });
      return;
    }
    message("密码已更新", { type: "success" });
    passwordDialogVisible.value = false;
  });
};

onMounted(async () => {
  const [{ code, data }, rolesResult] = await Promise.all([
    getMine(),
    getAllRoleList(),
  ]);
  roleOptions.value = rolesResult.data ?? [];
  if (code === 0) {
    Object.assign(userInfos, data);
    userInfos.description = data.description || data.remark || "";
  }
});
</script>

<template>
  <div :class="['min-w-45', deviceDetection() ? 'max-w-full' : 'max-w-[70%]']">
    <h3 class="my-8!">个人信息</h3>
    <el-form
      ref="userInfoFormRef"
      label-position="top"
      :rules="rules"
      :model="userInfos"
    >
      <el-form-item label="头像">
        <el-avatar :size="80" :src="userInfos.avatar" />
        <el-upload
          ref="uploadRef"
          accept="image/*"
          action="#"
          :limit="1"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="onChange"
        >
          <el-button plain class="ml-4!">
            <IconifyIconOffline :icon="uploadLine" />
            <span class="ml-2">更新头像</span>
          </el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="userInfos.username" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="userInfos.email"
          placeholder="请输入邮箱"
          clearable
        />
      </el-form-item>
      <el-form-item label="角色" prop="roleIds">
        <el-select
          v-model="userInfos.roleIds"
          placeholder="请选择角色"
          class="w-full"
          multiple
          collapse-tags
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="userInfos.status"
          inline-prompt
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="停用"
        />
      </el-form-item>
      <el-form-item label="简介">
        <el-input
          v-model="userInfos.description"
          placeholder="请输入简介"
          type="textarea"
          :autosize="{ minRows: 6, maxRows: 8 }"
          maxlength="56"
          show-word-limit
        />
      </el-form-item>
      <el-button type="primary" @click="onSubmit(userInfoFormRef)">
        更新信息
      </el-button>
      <el-button @click="openPasswordDialog">重置密码</el-button>
    </el-form>
    <el-dialog
      v-model="isShow"
      width="40%"
      title="编辑头像"
      destroy-on-close
      :closeOnClickModal="false"
      :before-close="handleClose"
      :fullscreen="deviceDetection()"
    >
      <ReCropperPreview ref="cropRef" :imgSrc="imgSrc" @cropper="onCropper" />
      <template #footer>
        <div class="dialog-footer">
          <el-button bg text @click="handleClose">取消</el-button>
          <el-button bg text type="primary" @click="handleSubmitImage">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      v-model="passwordDialogVisible"
      width="30%"
      title="重置密码"
      destroy-on-close
      :closeOnClickModal="false"
      :fullscreen="deviceDetection()"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button bg text @click="passwordDialogVisible = false">
          取消
        </el-button>
        <el-button bg text type="primary" @click="handleResetPassword">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
