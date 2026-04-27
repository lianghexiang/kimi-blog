import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Role, Permission } from "@/types/api";
import { Plus, Edit3, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function RolesTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    permissionIds: [] as number[],
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", "list"],
    queryFn: () => api.roles.list(),
  });

  const { data: permissions } = useQuery({
    queryKey: ["permissions", "list"],
    queryFn: () => api.roles.permissions(),
  });

  const createRole = useMutation({
    mutationFn: api.roles.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
      closeDialog();
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.roles.update>[1] }) =>
      api.roles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
      closeDialog();
    },
  });

  const deleteRole = useMutation({
    mutationFn: api.roles.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", "list"] });
    },
  });

  const openCreate = () => {
    setEditingRole(null);
    setForm({ name: "", description: "", permissionIds: [] });
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      permissionIds: role.permissions.map((p) => p.id),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setForm({ name: "", description: "", permissionIds: [] });
  };

  const togglePermission = (permId: number) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const payload = {
      name: form.name,
      description: form.description || undefined,
      permissionIds: form.permissionIds.length > 0 ? form.permissionIds : undefined,
    };
    if (editingRole) {
      updateRole.mutate({ id: editingRole.id, data: payload });
    } else {
      createRole.mutate(payload);
    }
  };

  if (rolesLoading) {
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
        新建角色
      </Button>

      <div className="space-y-4">
        {roles?.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl p-4 neo-border flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-blue-500" />
                <h4 className="font-bold text-gray-900">{role.name}</h4>
                {role.description && (
                  <span className="text-xs text-gray-400">
                    {role.description}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {role.permissions.length > 0 ? (
                  role.permissions.map((p) => (
                    <Badge
                      key={p.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {p.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">暂无权限</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => openEdit(role)}
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`确定删除角色 "${role.name}"？`)) {
                    deleteRole.mutate(role.id);
                  }
                }}
                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {roles?.length === 0 && (
          <p className="text-center text-gray-400 py-8">暂无角色</p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white rounded-2xl neo-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "编辑角色" : "新建角色"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色名称
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如 admin、editor"
                required
                className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="角色描述"
                className="border-2 border-gray-200 rounded-xl focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                权限分配
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border-2 border-gray-100 rounded-xl">
                {permissions?.map((perm: Permission) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={form.permissionIds.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <span className="text-sm text-gray-700">
                      {perm.name}
                    </span>
                  </label>
                ))}
                {(!permissions || permissions.length === 0) && (
                  <p className="text-sm text-gray-400 col-span-full">
                    暂无权限数据
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="rounded-xl"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createRole.isPending || updateRole.isPending}
                className="px-6 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {createRole.isPending || updateRole.isPending
                  ? "保存中..."
                  : editingRole
                  ? "更新"
                  : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
