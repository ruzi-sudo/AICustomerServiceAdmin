interface FormItemProps {
  /** 菜单类型（0代表菜单、1代表按钮）*/
  menuType: number;
  higherMenuOptions: Record<string, unknown>[];
  parentId: number;
  title: string;
  name: string;
  path: string;
  component: string;
  rank: number;
  redirect: string;
  icon: string;
  extraIcon: string;
  enterTransition: string;
  leaveTransition: string;
  activePath: string;
  auths: string;
  keepAlive: boolean;
  hiddenTag: boolean;
  fixedTag: boolean;
  showLink: boolean;
  showParent: boolean;
  status: number;
  id?: number;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
