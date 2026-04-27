import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User, Role } from "@/types/api";
import { Plus, Edit3, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function UsersTab() {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    isActive: true,
    roleIds: [] as number[],
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    isActive: true,
    roleIds: [] as number[],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "list"],
    queryFn: () => api.users.list(),
  });

  const { data: roles } = useQuery({
    queryKey: ["roles", "list"],
    queryFn: () => api.roles.list(),
  });

  const createUser = useMutation({
    mutationFn: api.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      closeCreateDialog();
    },
  });

  const updateUser = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof api.users.update>[1];
    }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      closeEditDialog();
    },
  });

  const deleteUser = useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });

  const openCreate = () => {
    setCreateForm({
      username: "",
      password: "",
      name: "",
      email: "",
      isActive: true,
      roleIds: [],
    });
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setCreateForm({
      username: "",
      password: "",
      name: "",
      email: "",
      isActive: true,
      roleIds: [],
    });
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      isActive: user.isActive,
      roleIds: user.roles.map((r) => r.id),
    });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    setEditForm({ name: "", email: "", isActive: true, roleIds: [] });
  };

  const toggleRole = (
    roleId: number,
    form: { roleIds: number[] },
    setter: React.Dispatch<React.SetStateAction<typeof form>>
  ) => {
    setter((prev: typeof form) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username || !createForm.password) return;
    createUser.mutate({
      username: createForm.username,
      password: createForm.password,
      name: createForm.name || undefined,
      email: createForm.email || undefined,
      isActive: createForm.isActive,
      roleIds: createForm.roleIds.length > 0 ? createForm.roleIds : undefined,
    });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser.mutate({
      id: editingUser.id,
      data: {
        name: editForm.name || undefined,
        email: editForm.email || undefined,
        isActive: editForm.isActive,
        roleIds: editForm.roleIds,
      },
    });
  };

  if (usersLoading) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        加载中...
      </div>
    );
  }

  return (
    <div>
      <Button
        onClick={openCreate}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-xl neo-border hover:bg-yellow-500 transition-colors mb-6"
      >
        <Plus className="w-4 h-4" />
        新建用户
      </Button>

      <div className="bg-white rounded-2xl neo-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    用户名
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  昵称
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  邮箱
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  角色
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  状态
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {u.username}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length > 0 ? (
                        u.roles.map((r) => (
                          <Badge
                            key={r.id}
                            variant={
                              r.name === "admin" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {r.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.isActive ? (
                      <span className="text-green-600 text-xs font-medium">
                        正常
                      </span>
                    ) : (
                      <span className="text-red-500 text-xs font-medium">
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("确定删除该用户？")) {
                            deleteUser.mutate(u.id);
                          }
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-gray-400"
                  >
                    暂无用户
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-white rounded-2xl neo-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建用户</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名 *
                </label>
                <Input
                  value={createForm.username}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, username: e.target.value })
                  }
                  placeholder="用户名"
                  required
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密码 *
                </label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  placeholder="密码"
                  required
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  昵称
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="昵称"
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="邮箱"
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={createForm.isActive}
                onCheckedChange={(checked) =>
                  setCreateForm({ ...createForm, isActive: checked })
                }
              />
              <span className="text-sm text-gray-700">
                {createForm.isActive ? "激活" : "禁用"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色分配
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border-2 border-gray-100 rounded-xl">
                {roles?.map((role: Role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={createForm.roleIds.includes(role.id)}
                      onCheckedChange={() =>
                        toggleRole(role.id, createForm, setCreateForm as any)
                      }
                    />
                    <span className="text-sm text-gray-700">
                      {role.name}
                    </span>
                  </label>
                ))}
                {(!roles || roles.length === 0) && (
                  <p className="text-sm text-gray-400 col-span-full">
                    暂无角色数据
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateDialog}
                className="rounded-xl"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createUser.isPending}
                className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {createUser.isPending ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white rounded-2xl neo-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  昵称
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="昵称"
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="邮箱"
                  className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, isActive: checked })
                }
              />
              <span className="text-sm text-gray-700">
                {editForm.isActive ? "激活" : "禁用"}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色分配
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border-2 border-gray-100 rounded-xl">
                {roles?.map((role: Role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={editForm.roleIds.includes(role.id)}
                      onCheckedChange={() =>
                        toggleRole(role.id, editForm, setEditForm as any)
                      }
                    />
                    <span className="text-sm text-gray-700">
                      {role.name}
                    </span>
                  </label>
                ))}
                {(!roles || roles.length === 0) && (
                  <p className="text-sm text-gray-400 col-span-full">
                    暂无角色数据
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
                className="rounded-xl"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={updateUser.isPending}
                className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {updateUser.isPending ? "保存中..." : "更新"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
