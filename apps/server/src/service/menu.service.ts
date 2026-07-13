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
  keepAlive: number | null;
  hiddenTag: number | null;
  fixedTag: number | null;
  showLink: number | null;
  showParent: number | null;
  status: number | null;
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
    keepAlive: p.keepAlive === 1,
    hiddenTag: p.hiddenTag === 1,
    fixedTag: p.fixedTag === 1,
    showLink: p.showLink !== 0,
    showParent: p.showParent === 1,
    status: p.status ?? 1,
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
          ne(sysPages.menuType, 1),
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
          ne(sysPages.menuType, 1),
          eq(sysPages.status, 1),
        ),
      );

    const pageIds = pageRows.map(r => r.id);
    if (pageIds.length === 0) return [];

    const allActivePages = await db
      .select()
      .from(sysPages)
      .where(eq(sysPages.status, 1))
      .orderBy(asc(sysPages.parentId), asc(sysPages.rank), asc(sysPages.id));

    const includeIds = collectPageIdsWithAncestors(allActivePages, pageIds);
    pages = allActivePages.filter(p => includeIds.has(p.id) && p.menuType !== 1);
  }

  return buildRouterTree(pages);
}

function collectPageIdsWithAncestors(pages: typeof sysPages.$inferSelect[], pageIds: number[]) {
  const includeIds = new Set(pageIds);
  const pageMap = new Map(pages.map(p => [p.id, p]));

  for (const pageId of pageIds) {
    let cursor = pageMap.get(pageId);
    while (cursor?.parentId) {
      includeIds.add(cursor.parentId);
      cursor = pageMap.get(cursor.parentId);
    }
  }

  return includeIds;
}

function buildRouterTree(pages: typeof sysPages.$inferSelect[]) {
  // 排除根 Layout（path="/"），home.ts 已定义
  const filteredPages = pages.filter(p => p.path !== '/' && p.menuType !== 1);
  const layoutId = pages.find(p => p.path === '/')?.id;

  const layoutPage = pages.find(p => p.path === '/');
  const childrenMap = new Map<number, typeof sysPages.$inferSelect[]>();
  for (const page of filteredPages) {
    const parentId = page.parentId ?? 0;
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
    childrenMap.get(parentId)!.push(page);
  }

  const toRoute = (page: typeof sysPages.$inferSelect) => {
    const children = (childrenMap.get(page.id) || []).map(toRoute);
    return {
      path: page.path || '',
      name: page.name || undefined,
      component: page.component || undefined,
      redirect: page.redirect || undefined,
      meta: {
        icon: page.icon || layoutPage?.icon || undefined,
        title: page.title,
        rank: page.rank ?? undefined,
        showLink: page.showLink !== 0,
        keepAlive: page.keepAlive === 1,
        hiddenTag: page.hiddenTag === 1,
        fixedTag: page.fixedTag === 1,
        auths: page.auths ? page.auths.split(',').filter(Boolean) : undefined,
      },
      ...(children.length > 0 ? { children } : {}),
    };
  };

  const topLevelParentIds = layoutId ? [layoutId, 0] : [0];
  const seenIds = new Set<number>();
  const routes = [];
  for (const parentId of topLevelParentIds) {
    for (const page of childrenMap.get(parentId) || []) {
      if (seenIds.has(page.id)) continue;
      seenIds.add(page.id);
      routes.push(toRoute(page));
    }
  }

  return routes;
}

export async function createMenu(params: Record<string, any>) {
  const db = await getDb();
  await assertValidParent(db, params.parentId ?? 0);
  await assertUniqueRouteFields(db, params);

  const [result] = await db.insert(sysPages).values({
    parentId: params.parentId ?? 0,
    menuType: params.menuType ?? 0,
    title: params.title,
    name: params.name || null,
    path: params.path || null,
    component: params.component || null,
    rank: params.rank ?? 99,
    redirect: params.redirect || null,
    icon: params.icon || null,
    extraIcon: params.extraIcon || null,
    enterTransition: params.enterTransition || null,
    leaveTransition: params.leaveTransition || null,
    activePath: params.activePath || null,
    auths: params.auths || null,
    keepAlive: params.keepAlive ?? 0,
    hiddenTag: params.hiddenTag ?? 0,
    fixedTag: params.fixedTag ?? 0,
    showLink: params.showLink ?? 1,
    showParent: params.showParent ?? 0,
    status: params.status ?? 1,
  } as typeof sysPages.$inferInsert);
  return { id: Number(result.insertId) };
}

export async function updateMenu(params: Record<string, any>) {
  const db = await getDb();
  const [existing] = await db
    .select({ id: sysPages.id })
    .from(sysPages)
    .where(eq(sysPages.id, params.id))
    .limit(1);
  if (!existing) {
    throw { code: 10003, message: '菜单不存在', status: 404 };
  }

  if (params.parentId !== undefined) {
    await assertValidParent(db, params.parentId, params.id);
  }
  await assertUniqueRouteFields(db, params, params.id);

  const updateData: Record<string, any> = {};
  const fields = ['parentId', 'menuType', 'title', 'name', 'path', 'component', 'rank', 'redirect', 'icon', 'extraIcon', 'enterTransition', 'leaveTransition', 'activePath', 'auths', 'keepAlive', 'hiddenTag', 'fixedTag', 'showLink', 'showParent', 'status'];
  for (const f of fields) {
    if (params[f] !== undefined) updateData[f] = params[f];
  }
  if (Object.keys(updateData).length > 0) {
    await db.update(sysPages).set(updateData).where(eq(sysPages.id, params.id));
  }
}

export async function deleteMenu(id: number) {
  const db = await getDb();
  const allPages = await db.select({ id: sysPages.id, parentId: sysPages.parentId }).from(sysPages);
  const ids = collectDescendantIds(allPages, id);
  if (ids.length === 0) {
    throw { code: 10003, message: '菜单不存在', status: 404 };
  }

  await db.delete(sysRolePages).where(inArray(sysRolePages.pageId, ids));
  await db.delete(sysPages).where(inArray(sysPages.id, ids));
}

async function assertValidParent(db: any, parentId: number, currentId?: number) {
  if (!parentId) return;
  if (currentId && parentId === currentId) {
    throw { code: 10001, message: '上级菜单不能选择自身', status: 400 };
  }

  const allPages = await db
    .select({ id: sysPages.id, parentId: sysPages.parentId, menuType: sysPages.menuType })
    .from(sysPages);
  const parent = allPages.find(p => p.id === parentId);
  if (!parent) {
    throw { code: 10003, message: '上级菜单不存在', status: 404 };
  }
  if (parent.menuType === 1) {
    throw { code: 10001, message: '按钮不能作为上级菜单', status: 400 };
  }
  if (currentId) {
    const descendantIds = collectDescendantIds(allPages, currentId);
    if (descendantIds.includes(parentId)) {
      throw { code: 10001, message: '上级菜单不能选择自身或下级菜单', status: 400 };
    }
  }
}

async function assertUniqueRouteFields(db: any, params: Record<string, any>, currentId?: number) {
  if (params.menuType === 1) return;
  if (params.name) {
    const rows = await db
      .select({ id: sysPages.id })
      .from(sysPages)
      .where(eq(sysPages.name, params.name))
      .limit(1);
    if (rows[0] && rows[0].id !== currentId) {
      throw { code: 10001, message: '路由名称已存在', status: 400 };
    }
  }
  if (params.path) {
    const rows = await db
      .select({ id: sysPages.id })
      .from(sysPages)
      .where(eq(sysPages.path, params.path))
      .limit(1);
    if (rows[0] && rows[0].id !== currentId) {
      throw { code: 10001, message: '路由路径已存在', status: 400 };
    }
  }
}

function collectDescendantIds(rows: { id: number; parentId: number | null }[], rootId: number) {
  const childrenMap = new Map<number, number[]>();
  const existingIds = new Set(rows.map(row => row.id));
  if (!existingIds.has(rootId)) return [];

  for (const row of rows) {
    const parentId = row.parentId ?? 0;
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
    childrenMap.get(parentId)!.push(row.id);
  }

  const result: number[] = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const currentId = stack.pop()!;
    result.push(currentId);
    stack.push(...(childrenMap.get(currentId) || []));
  }
  return result;
}
