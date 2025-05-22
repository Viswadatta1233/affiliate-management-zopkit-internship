import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, Shield } from "lucide-react";

export default function UsersAndRoles() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
          <p className="text-muted-foreground">Manage users and their permissions</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">
              Active platform users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              Configured roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "John Doe",
                email: "john@example.com",
                role: "Admin",
                status: "active",
                lastActive: "2 minutes ago"
              },
              {
                name: "Jane Smith",
                email: "jane@example.com",
                role: "Manager",
                status: "active",
                lastActive: "1 hour ago"
              },
              {
                name: "Bob Johnson",
                email: "bob@example.com",
                role: "User",
                status: "inactive",
                lastActive: "3 days ago"
              }
            ].map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={user.status === "active" ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last active: {user.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
          <CardDescription>Configure role permissions and access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: "Admin",
                description: "Full system access",
                users: 3,
                permissions: ["all"]
              },
              {
                name: "Manager",
                description: "Manage users and content",
                users: 5,
                permissions: ["users.manage", "content.manage"]
              },
              {
                name: "User",
                description: "Basic platform access",
                users: 17,
                permissions: ["content.view"]
              }
            ].map((role, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.permissions.map((permission, i) => (
                      <Badge key={i} variant="outline">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{role.users} users</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}