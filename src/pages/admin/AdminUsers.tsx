import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, ShieldOff, Crown, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_premium: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "admin" | "moderator" | "user";
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"user" | "moderator" | "admin">("user");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: "admin" | "moderator" }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Role added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add role: ${error.message}`);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("Role removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  const getUserRoles = (userId: string) => {
    return userRoles.filter((r) => r.user_id === userId).map((r) => r.role);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Email and password are required");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsCreatingUser(true);
    try {
      // Create user via Supabase Auth admin API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // If role is admin or moderator, add to user_roles table
      if (newUserRole !== "user") {
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: newUserRole,
        });
        if (roleError) {
          console.error("Failed to assign role:", roleError);
          toast.error("User created but failed to assign role");
        }
      }

      toast.success(`User ${newUserEmail} created successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });

      // Reset form
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("user");
      setShowAddUserDialog(false);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const resetForm = () => {
    setNewUserEmail("");
    setNewUserName("");
    setNewUserPassword("");
    setNewUserRole("user");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">Manage user accounts and roles</p>
          </div>
          <Button onClick={() => setShowAddUserDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users yet
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => {
                  const roles = getUserRoles(profile.user_id);
                  const isAdmin = roles.includes("admin");
                  const isModerator = roles.includes("moderator");

                  return (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.full_name || "No name"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isAdmin && (
                            <Badge variant="destructive">Admin</Badge>
                          )}
                          {isModerator && (
                            <Badge variant="secondary">Moderator</Badge>
                          )}
                          {!isAdmin && !isModerator && (
                            <Badge variant="outline">User</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.is_premium ? (
                          <Crown className="w-4 h-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(profile.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addRoleMutation.mutate({ user_id: profile.user_id, role: "admin" })}
                              className="text-xs"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Make Admin
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Remove admin role from this user?")) {
                                  removeRoleMutation.mutate({ user_id: profile.user_id, role: "admin" });
                                }
                              }}
                              className="text-xs text-destructive hover:text-destructive"
                            >
                              <ShieldOff className="w-3 h-3 mr-1" />
                              Remove Admin
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={(open) => {
        setShowAddUserDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with a specific role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "user" | "moderator" | "admin")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreatingUser}>
              {isCreatingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
