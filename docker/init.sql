-- ============================================================
-- PureAdmin Initial Database Schema
-- All tables use `sys_` prefix
-- ============================================================

USE pureadmin;

-- ----------------------------
-- 1. 系统配置表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_configs (
    id            INT PRIMARY KEY AUTO_INCREMENT COMMENT '配置ID',
    config_key    VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
    config_value  TEXT COMMENT '配置值',
    description   VARCHAR(255) COMMENT '配置说明',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ----------------------------
-- 2. 用户表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_users (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username    VARCHAR(64) UNIQUE NOT NULL COMMENT '用户名',
    password    VARCHAR(255) NOT NULL COMMENT '密码',
    avatar      VARCHAR(512) COMMENT '头像URL',
    email       VARCHAR(128) COMMENT '邮箱',
    status      TINYINT DEFAULT 1 COMMENT '状态(1启用 0停用)',
    remark      TEXT COMMENT '备注',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- 3. 角色表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_roles (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
    name        VARCHAR(64) NOT NULL COMMENT '角色名称',
    code        VARCHAR(64) UNIQUE NOT NULL COMMENT '角色标识',
    status      TINYINT DEFAULT 1 COMMENT '状态(1启用 0停用)',
    remark      TEXT COMMENT '备注',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- ----------------------------
-- 4. 用户角色关联表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_user_roles (
    id       INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    user_id  INT NOT NULL COMMENT '用户ID',
    role_id  INT NOT NULL COMMENT '角色ID',
    UNIQUE KEY uk_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- ----------------------------
-- 5. 页面/菜单表
-- menu_type: 0=菜单 1=按钮
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_pages (
    id                INT PRIMARY KEY AUTO_INCREMENT COMMENT '页面ID',
    parent_id         INT DEFAULT 0 COMMENT '父级ID',
    menu_type         TINYINT DEFAULT 0 COMMENT '类型(0菜单 1按钮)',
    title             VARCHAR(128) NOT NULL COMMENT '菜单标题/i18n键',
    name              VARCHAR(128) COMMENT '路由名称',
    path              VARCHAR(255) COMMENT '路由路径',
    component         VARCHAR(255) COMMENT '组件路径',
    `rank`            INT DEFAULT 99 COMMENT '排序号',
    redirect          VARCHAR(255) COMMENT '重定向地址',
    icon              VARCHAR(64) COMMENT '图标',
    extra_icon        VARCHAR(64) COMMENT '右侧图标',
    enter_transition  VARCHAR(64) COMMENT '进场动画',
    leave_transition  VARCHAR(64) COMMENT '离场动画',
    active_path       VARCHAR(255) COMMENT '激活菜单路径',
    auths             VARCHAR(255) COMMENT '按钮权限标识',
    keep_alive        TINYINT DEFAULT 0 COMMENT '缓存页面(1是 0否)',
    hidden_tag        TINYINT DEFAULT 0 COMMENT '禁止标签页(1禁止 0允许)',
    fixed_tag         TINYINT DEFAULT 0 COMMENT '固定标签页(1固定 0不固定)',
    show_link         TINYINT DEFAULT 1 COMMENT '菜单显示(1显示 0隐藏)',
    show_parent       TINYINT DEFAULT 0 COMMENT '显示父菜单(1显示 0隐藏)',
    status            TINYINT DEFAULT 1 COMMENT '状态(1启用 0停用)',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面/菜单表';

-- ----------------------------
-- 6. 角色页面权限关联表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_role_pages (
    id       INT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
    role_id  INT NOT NULL COMMENT '角色ID',
    page_id  INT NOT NULL COMMENT '页面ID',
    UNIQUE KEY uk_role_page (role_id, page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色页面权限关联表';

-- ----------------------------
-- 7. 登录日志表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_login_logs (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id     INT DEFAULT 0 COMMENT '用户ID',
    username    VARCHAR(64) NOT NULL COMMENT '用户名',
    ip          VARCHAR(64) COMMENT '登录IP',
    address     VARCHAR(128) COMMENT '登录地点',
    `system`    VARCHAR(64) COMMENT '操作系统',
    browser     VARCHAR(64) COMMENT '浏览器',
    status      TINYINT DEFAULT 1 COMMENT '状态(1成功 0失败)',
    login_time  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ----------------------------
-- 8. 系统日志表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_system_logs (
    id              INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    user_id         INT DEFAULT 0 COMMENT '用户ID',
    username        VARCHAR(64) COMMENT '操作人',
    module          VARCHAR(64) COMMENT '模块',
    operation       VARCHAR(255) COMMENT '操作描述',
    request_url     VARCHAR(512) COMMENT '请求地址',
    request_method  VARCHAR(16) COMMENT '请求方法',
    request_params  TEXT COMMENT '请求参数',
    response_data   TEXT COMMENT '响应数据',
    error_message   TEXT COMMENT '错误信息',
    ip              VARCHAR(64) COMMENT '来源IP',
    address         VARCHAR(128) COMMENT '地点',
    `system`        VARCHAR(64) COMMENT '操作系统',
    browser         VARCHAR(64) COMMENT '浏览器',
    takes_time      INT DEFAULT 0 COMMENT '请求耗时(ms)',
    status          TINYINT DEFAULT 0 COMMENT '状态(1成功 0异常)',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- ----------------------------
-- 9. 系统日志详情表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_system_log_details (
    id                INT PRIMARY KEY AUTO_INCREMENT COMMENT '详情ID',
    log_id            INT NOT NULL COMMENT '关联系统日志ID',
    request_body      TEXT COMMENT '请求体',
    request_headers   TEXT COMMENT '请求头',
    response_headers  TEXT COMMENT '响应头',
    response_body     TEXT COMMENT '响应体',
    stack_trace       TEXT COMMENT '异常堆栈',
    trace_id          VARCHAR(64) COMMENT '链路追踪ID',
    request_time      DATETIME COMMENT '请求时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志详情表';

-- ----------------------------
-- 10. 在线用户表
-- ----------------------------
CREATE TABLE IF NOT EXISTS sys_online_users (
    id          INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    user_id     INT DEFAULT 0 COMMENT '用户ID',
    username    VARCHAR(64) NOT NULL COMMENT '用户名',
    ip          VARCHAR(64) COMMENT '来源IP',
    address     VARCHAR(128) COMMENT '地点',
    `system`    VARCHAR(64) COMMENT '操作系统',
    browser     VARCHAR(64) COMMENT '浏览器',
    login_time  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线用户表';

-- ============================================================
-- Seed Data
-- ============================================================

INSERT IGNORE INTO sys_configs (config_key, config_value, description) VALUES
('Version', '7.0.0', '系统版本'),
('Title', 'PureAdmin', '系统标题'),
('FixedHeader', 'true', '固定头部'),
('HiddenSideBar', 'false', '隐藏侧边栏'),
('MultiTagsCache', 'false', '多标签缓存'),
('KeepAlive', 'true', '页面缓存'),
('Locale', 'zh', '默认语言'),
('Layout', 'vertical', '布局模式'),
('Theme', 'light', '主题色'),
('DarkMode', 'false', '深色模式'),
('ThemeMode', 'light', '主题模式'),
('Grey', 'false', '灰色模式'),
('Weak', 'false', '色弱模式'),
('HideTabs', 'false', '隐藏标签页'),
('HideFooter', 'false', '隐藏底部'),
('Stretch', 'false', '内容拉伸'),
('SidebarStatus', 'true', '侧边栏状态'),
('EpThemeColor', '#409EFF', 'Element主题色'),
('ShowLogo', 'true', '显示Logo'),
('Watermark', 'false', '水印'),
('TagsStyle', 'chrome', '标签风格'),
('TooltipEffect', 'light', '提示效果'),
('ResponsiveStorageNameSpace', 'responsive-', '存储命名空间'),
('MenuSearchHistory', '6', '菜单搜索历史'),
('CachingAsyncRoutes', 'false', '缓存动态路由');

-- 密码: admin123
INSERT IGNORE INTO sys_users (id, username, password, avatar, email, status, remark) VALUES
(1, 'admin', '$2a$10$dvAenDGUE2prXBAKMuhpj.ALgUIIZP59GeeMp/QXqh5QonPgYsZMK', 'https://avatars.githubusercontent.com/u/44761321', 'admin@pureadmin.cn', 1, '管理员'),
(2, 'common', '$2a$10$dvAenDGUE2prXBAKMuhpj.ALgUIIZP59GeeMp/QXqh5QonPgYsZMK', 'https://avatars.githubusercontent.com/u/52823142', 'common@pureadmin.cn', 1, '普通用户');

INSERT IGNORE INTO sys_roles (id, name, code, status, remark) VALUES
(1, '超级管理员', 'admin', 1, '超级管理员，拥有全部权限'),
(2, '普通角色', 'common', 1, '普通角色，拥有有限的权限');

INSERT IGNORE INTO sys_user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2);

INSERT IGNORE INTO sys_pages (id, parent_id, menu_type, title, name, path, component, `rank`, icon, auths, status) VALUES
(1, 0, 0, 'menus.pureHome', 'Home', '/', 'layout/index.vue', 0, 'ep/home-filled', NULL, 1),
(2, 1, 0, 'menus.pureHome', 'Welcome', '/welcome', 'views/welcome/index.vue', 0, NULL, NULL, 1),
(5, 0, 0, 'menus.pureSysManagement', NULL, '/system', NULL, 2, 'ri/settings-3-line', NULL, 1),
(6, 5, 0, 'menus.pureUser', 'SystemUser', '/system/user/index', 'views/system/user/index.vue', 1, 'ri/admin-line', NULL, 1),
(7, 5, 0, 'menus.pureRole', 'SystemRole', '/system/role/index', 'views/system/role/index.vue', 2, 'ri/admin-fill', NULL, 1),
(8, 5, 0, 'menus.pureSystemMenu', 'SystemMenu', '/system/menu/index', 'views/system/menu/index.vue', 3, 'ep/menu', NULL, 1),
(9, 0, 0, 'menus.pureSysMonitor', NULL, '/monitor', NULL, 3, 'ep/monitor', NULL, 1),
(10, 9, 0, 'menus.pureOnlineUser', 'OnlineUser', '/monitor/online-user', 'views/monitor/online/index.vue', 1, 'ri/user-voice-line', NULL, 1),
(11, 9, 0, 'menus.pureLoginLog', 'LoginLog', '/monitor/login-logs', 'views/monitor/logs/login/index.vue', 2, 'ri/window-line', NULL, 1),
(13, 9, 0, 'menus.pureSystemLog', 'SystemLog', '/monitor/system-logs', 'views/monitor/logs/system/index.vue', 4, 'ri/file-search-line', NULL, 1);

INSERT IGNORE INTO sys_role_pages (role_id, page_id)
SELECT 1, id FROM sys_pages;

INSERT IGNORE INTO sys_role_pages (role_id, page_id) VALUES
(2, 1),
(2, 2);

INSERT IGNORE INTO sys_login_logs (id, user_id, username, ip, address, `system`, browser, status, login_time) VALUES
(1, 1, 'admin', '192.168.1.100', '中国河南省信阳市', 'macOS', 'Chrome', 1, '2025-01-01 09:00:00'),
(2, 2, 'common', '192.168.1.101', '中国广东省深圳市', 'Windows', 'Firefox', 1, '2025-01-01 09:30:00');

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_configs_key ON sys_configs(config_key);
CREATE INDEX idx_users_username ON sys_users(username);
CREATE INDEX idx_roles_code ON sys_roles(code);
CREATE INDEX idx_user_roles_user_id ON sys_user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON sys_user_roles(role_id);
CREATE INDEX idx_pages_parent_id ON sys_pages(parent_id);
CREATE INDEX idx_role_pages_role_id ON sys_role_pages(role_id);
CREATE INDEX idx_role_pages_page_id ON sys_role_pages(page_id);
CREATE INDEX idx_login_logs_username ON sys_login_logs(username);
CREATE INDEX idx_system_logs_username ON sys_system_logs(username);
CREATE INDEX idx_system_logs_module ON sys_system_logs(module);
CREATE INDEX idx_system_log_details_log_id ON sys_system_log_details(log_id);
CREATE INDEX idx_online_users_username ON sys_online_users(username);
