import { eq, and, ne, inArray, isNotNull, count, desc, asc } from 'drizzle-orm';
import { getDb } from '../db';
import { sysPages, sysRoles, sysRolePages } from '../db/schema';

function mapPage(p: {
  id: number;
  parentId: number | null;
  menuType: number | null;
  title: string;
  name: string | null;
  path: string | null;
  component: string | null;
  rank: number | null;
  redirect: string | null;
  icon: string | null;
  extraIcon: string | null;
  enterTransition: string | null;
  leaveTransition: string | null;
  activePath: string | null;
  auths: string | null;
  frameSrc: string | null;
  frameLoading: number | null;
  keepAlive: number | null;
  hiddenTag: number | null;
  fixedTag: number | null;
  showLink: number | null;
  showParent: number | null;
}) {
  return {
    parentId: p.parentId ?? 0,
    id: p.id,
    menuType: p.menuType ?? 0,
    title: p.title,
    name: p.name || '',
    path: p.path || '',
    component: p.component || '',
    rank: p.rank,
    redirect: p.redirect || '',
    icon: p.icon || '',
    extraIcon: p.extraIcon || '',
    enterTransition: p.enterTransition || '',
    leaveTransition: p.leaveTransition || '',
    activePath: p.activePath || '',
    auths: p.auths || '',
    frameSrc: p.frameSrc || '',
    frameLoading: p.frameLoading === 1,
    keepAlive: p.keepAlive === 1,
    hiddenTag: p.hiddenTag === 1,
    fixedTag: p.fixedTag === 1,
    showLink: p.showLink !== 0,
    showParent: p.showParent === 1,
  };
}

export async function listAllMenus() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(sysPages)
    .orderBy(asc(sysPages.parentId), asc(sysPages.rank), asc(sysPages.id));
  return rows.map(mapPage);
}

export async function getRoleMenuTree() {
  const db = await getDb();
  const rows = await db
    .select({
      parentId: sysPages.parentId,
      id: sysPages.id,
      menuType: sysPages.menuType,
      title: sysPages.title,
    })
    .from(sysPages)
    .orderBy(asc(sysPages.parentId), asc(sysPages.id));
  return rows.map(r => ({
    parentId: r.parentId ?? 0,
    id: r.id,
    menuType: r.menuType ?? 0,
    title: r.title,
  }));
}

export async function getMenuIdsByRoleId(roleId: number) {
  const db = await getDb();
  const rows = await db
    .select({ pageId: sysRolePages.pageId })
    .from(sysRolePages)
    .where(eq(sysRolePages.roleId, roleId));
  return rows.map(r => r.pageId);
}

export async function getAsyncRoutes(roles: string[]) {
  const db = await getDb();
  const isAdmin = roles.includes('admin');

  let pages: typeof sysPages.$inferSelect[];
  if (isAdmin) {
    pages = await db
      .select()
      .from(sysPages)
      .where(
        and(
          ne(sysPages.menuType, 3),
          eq(sysPages.status, 1),
        ),
      )
      .orderBy(asc(sysPages.parentId), asc(sysPages.rank), asc(sysPages.id));
  } else {
    const roleRows = await db
      .select({ id: sysRoles.id })
      .from(sysRoles)
      .where(inArray(sysRoles.code, roles));

    const roleIds = roleRows.map(r => r.id);
    if (roleIds.length === 0) return [];

    const pageRows = await db
      .selectDistinct({ id: sysPages.id })
      .from(sysPages)
      .innerJoin(sysRolePages, eq(sysPages.id, sysRolePages.pageId))
      .where(
        and(
          inArray(sysRolePages.roleId, roleIds),
          ne(sysPages.menuType, 3),
          eq(sysPages.status, 1),
        ),
      );

    const pageIds = pageRows.map(r => r.id);
    if (pageIds.length === 0) return [];

    pages = await db
      .select()
      .from(sysPages)
      .where(inArray(sysPages.id, pageIds))
      .orderBy(asc(sysPages.parentId), asc(sysPages.rank), asc(sysPages.id));
  }

  return buildRouterTree(pages);
}

function buildRouterTree(pages: typeof sysPages.$inferSelect[]) {
  // 排除根 Layout（path="/"），home.ts 已定义
  const filteredPages = pages.filter(p => p.path !== '/');
  const layoutId = pages.find(p => p.path === '/')?.id;

  // 收集根 Layout 下的子路由作为顶级路由
  const layoutChildren = layoutId
    ? filteredPages.filter(c => c.parentId === layoutId).map(p => ({
        path: p.path || '',
        name: p.name || undefined,
        component: p.component || undefined,
        meta: {
          icon: p.icon || undefined,
          title: p.title,
          rank: p.rank ?? undefined,
          showLink: p.showLink !== 0,
          keepAlive: p.keepAlive === 1,
          hiddenTag: p.hiddenTag === 1,
          fixedTag: p.fixedTag === 1,
          auths: p.auths ? p.auths.split(',').filter(Boolean) : undefined,
          frameSrc: p.frameSrc || undefined,
        },
      }))
    : [];

  // 其他顶级菜单及其子路由
  const otherMenus = filteredPages
    .filter(p => p.menuType === 0 && p.parentId === 0)
    .map(p => ({
      path: p.path || '/',
      name: p.name ? p.name + "Parent" : undefined,
      redirect: p.redirect || undefined,
      meta: {
        icon: p.icon || undefined,
        title: p.title,
        rank: p.rank ?? undefined,
        showLink: p.showLink !== 0,
      },
      children: filteredPages
        .filter(c => c.parentId === p.id && c.menuType === 0)
        .map(c => ({
          path: c.path || '',
          name: c.name || undefined,
          component: c.component || undefined,
          meta: {
            icon: c.icon || undefined,
            title: c.title,
            rank: c.rank ?? undefined,
            showLink: c.showLink !== 0,
            keepAlive: c.keepAlive === 1,
            hiddenTag: c.hiddenTag === 1,
            fixedTag: c.fixedTag === 1,
            auths: c.auths ? c.auths.split(',').filter(Boolean) : undefined,
            frameSrc: c.frameSrc || undefined,
          },
        })),
    }));

  return [...layoutChildren, ...otherMenus];
}
