
"use client";

import { useUser, useDatabase, useRtdb, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Settings, 
  Bell, 
  Cpu, 
  Smartphone,
  Loader2,
  Trash2,
  LogOut,
  UserPlus,
  Layers,
  Zap,
  PlusCircle,
  Pencil,
  PlusSquare,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ref, set, push, remove, update } from "firebase/database";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type TabType = 'buddies' | 'nodes' | 'notifications' | 'settings';

const DEFAULT_BUDDY_GROUPS = ["Family", "Friend", "Close Friend"];

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { auth } = useFirebase();
  const rtdb = useDatabase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('buddies');
  const [hasMounted, setHasMounted] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [buddyForm, setBuddyForm] = useState({
    name: '',
    phoneNumber: '',
    groups: [] as string[]
  });

  const [nodeForm, setNodeForm] = useState({
    nodeName: '',
    hardwareId: '',
    targetGroups: [] as string[]
  });

  const [isAddBuddyDialogOpen, setIsAddBuddyDialogOpen] = useState(false);
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  const [isEditBuddyDialogOpen, setIsEditBuddyDialogOpen] = useState(false);
  const [isEditNodeDialogOpen, setIsEditNodeDialogOpen] = useState(false);
  const [isViewItemDialogOpen, setIsViewItemDialogOpen] = useState(false);
  const [isManageGroupsDialogOpen, setIsManageGroupsDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [itemToView, setItemToView] = useState<any>(null);
  const [itemToEdit, setItemToEdit] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const currentName = useMemo(() => {
    if (!user?.email) return "User";
    return user.email.split('@')[0];
  }, [user]);

  useEffect(() => {
    setHasMounted(true);
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  const groupsRef = useMemo(() => user ? ref(rtdb, `users/${user.uid}/buddyGroups`) : null, [rtdb, user]);
  const { data: customGroupsData } = useRtdb(groupsRef);

  const buddiesRef = useMemo(() => user ? ref(rtdb, `users/${user.uid}/buddies`) : null, [rtdb, user]);
  const { data: buddiesData } = useRtdb(buddiesRef);

  const nodesRef = useMemo(() => user ? ref(rtdb, `users/${user.uid}/nodes`) : null, [rtdb, user]);
  const { data: nodesData } = useRtdb(nodesRef);

  const notificationsRef = useMemo(() => user ? ref(rtdb, `users/${user.uid}/notifications`) : null, [rtdb, user]);
  const { data: notificationsData } = useRtdb(notificationsRef);

  const sosSystemRef = useMemo(() => ref(rtdb, "sosSystem"), [rtdb]);
  const { data: sosStatus } = useRtdb(sosSystemRef);

  const buddyGroups = useMemo(() => {
    const customNames = customGroupsData ? Object.values(customGroupsData).map((g: any) => g.name) : [];
    return Array.from(new Set([...DEFAULT_BUDDY_GROUPS, ...customNames]));
  }, [customGroupsData]);

  const buddies = useMemo(() => {
    if (!buddiesData) return [];
    return Object.entries(buddiesData).map(([id, val]: [string, any]) => ({ ...val, id }));
  }, [buddiesData]);

  const nodes = useMemo(() => {
    if (!nodesData) return [];
    return Object.entries(nodesData).map(([id, val]: [string, any]) => ({ ...val, id }));
  }, [nodesData]);

  const notifications = useMemo(() => {
    if (!notificationsData) return [];
    return Object.entries(notificationsData)
      .map(([id, val]: [string, any]) => ({ ...val, id }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [notificationsData]);

  const handleRegisterBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rtdb) return;
    setRegisterLoading(true);
    const buddyId = `BUDDY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const payload = { ...buddyForm, id: buddyId, registeredAt: Date.now() };
    set(ref(rtdb, `users/${user.uid}/buddies/${buddyId}`), payload)
      .then(() => {
        setIsAddBuddyDialogOpen(false);
        setBuddyForm({ name: '', phoneNumber: '', groups: [] });
        toast({ title: "Buddy Registered" });
      })
      .finally(() => setRegisterLoading(false));
  };

  const handleUpdateBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rtdb || !itemToEdit) return;
    setRegisterLoading(true);
    update(ref(rtdb, `users/${user.uid}/buddies/${itemToEdit.id}`), itemToEdit)
      .then(() => {
        setIsEditBuddyDialogOpen(false);
        setItemToEdit(null);
        toast({ title: "Buddy Updated" });
      })
      .finally(() => setRegisterLoading(false));
  };

  const handleRegisterNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rtdb) return;
    setRegisterLoading(true);
    const nodeId = nodeForm.hardwareId || `NODE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const payload = { ...nodeForm, id: nodeId, status: 'online', registeredAt: Date.now() };
    set(ref(rtdb, `users/${user.uid}/nodes/${nodeId}`), payload)
      .then(() => {
        setIsAddNodeDialogOpen(false);
        setNodeForm({ nodeName: '', hardwareId: '', targetGroups: [] });
        toast({ title: "Node Armed" });
      })
      .finally(() => setRegisterLoading(false));
  };

  const handleUpdateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rtdb || !itemToEdit) return;
    setRegisterLoading(true);
    update(ref(rtdb, `users/${user.uid}/nodes/${itemToEdit.id}`), itemToEdit)
      .then(() => {
        setIsEditNodeDialogOpen(false);
        setItemToEdit(null);
        toast({ title: "Node Configuration Updated" });
      })
      .finally(() => setRegisterLoading(false));
  };

  const triggerNodeAlert = (node: any) => {
    if (!user || !rtdb) return;
    const isCurrentlyActive = sosStatus?.sosTrigger === true;
    if (isCurrentlyActive) {
      update(ref(rtdb, "sosSystem"), { sosTrigger: false, timestamp: Date.now() });
      return;
    }
    const broadcastSOS = async (lat?: number, lng?: number) => {
      update(ref(rtdb, "sosSystem"), {
        sosTrigger: true,
        sender: user.email || "Unknown",
        nodename: node.nodeName,
        timestamp: Date.now(),
        triggeredByNode: node.id,
        latitude: lat || null,
        longitude: lng || null,
      });
    };
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => broadcastSOS(pos.coords.latitude, pos.coords.longitude),
        () => broadcastSOS(),
        { timeout: 5000 }
      );
    } else broadcastSOS();
  };

  if (userLoading || !hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { id: 'buddies', label: 'Buddies', icon: Smartphone },
    { id: 'nodes', label: 'Nodes', icon: Cpu },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Setup', icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-64 bg-card/10 border-r border-white/5 p-6">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-accent/20">
              <AvatarFallback className="bg-primary/20 text-accent font-bold">
                {currentName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{currentName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 transition-all rounded-xl text-xs font-bold uppercase tracking-wider",
                  activeTab === item.id 
                    ? "bg-primary text-white shadow-lg" 
                    : "hover:bg-white/5 text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'buddies' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Buddy Hub</h1>
                <div className="flex gap-3">
                  <Button onClick={() => setIsAddBuddyDialogOpen(true)} className="rounded-xl font-bold text-xs uppercase tracking-widest px-6">
                    <UserPlus className="h-4 w-4 mr-2" /> Enlist
                  </Button>
                  <Button onClick={() => setIsManageGroupsDialogOpen(true)} variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6">
                    <Layers className="h-4 w-4 mr-2" /> Groups
                  </Button>
                </div>
              </div>

              {buddies.length === 0 ? (
                <Card className="glass-card p-24 text-center">
                  <Smartphone className="h-12 w-12 text-accent/20 mx-auto mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No Active Personnel</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buddies.map(buddy => (
                    <Card key={buddy.id} className="glass-card border-none group">
                      <CardHeader className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-lg font-bold">{buddy.name}</p>
                            <p className="text-xs font-mono text-accent/60">{buddy.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {buddy.groups?.map((g: string) => (
                            <Badge key={g} variant="outline" className="text-[8px] opacity-60">{g}</Badge>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <div className="flex gap-2 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-9 rounded-lg text-[10px] font-bold uppercase tracking-widest flex-1" onClick={() => { setItemToEdit(buddy); setIsEditBuddyDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</Button>
                          <Button variant="ghost" size="sm" className="h-9 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { setItemToDelete({ ...buddy, type: 'buddy' }); setIsDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Hardware Hub</h1>
                <Button onClick={() => setIsAddNodeDialogOpen(true)} className="rounded-xl font-bold text-xs uppercase tracking-widest px-6">
                  <PlusSquare className="h-4 w-4 mr-2" /> Arm Node
                </Button>
              </div>

              {nodes.length === 0 ? (
                <Card className="glass-card p-24 text-center">
                  <Cpu className="h-12 w-12 text-accent/20 mx-auto mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">No Linked Systems</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nodes.map(node => (
                    <Card key={node.id} className="glass-card border-none group">
                      <CardHeader className="p-6">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-lg font-bold">{node.nodeName}</p>
                          <div className={cn("h-2.5 w-2.5 rounded-full", node.status === 'online' ? 'bg-accent shadow-[0_0_8px_rgba(76,201,240,0.5)]' : 'bg-muted')} />
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">ID: {node.hardwareId}</p>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-4">
                        <div className="flex flex-wrap gap-1.5">
                          {node.targetGroups?.map((g: string) => (
                            <Badge key={g} className="bg-white/5 border-white/10 text-muted-foreground text-[8px]">{g}</Badge>
                          ))}
                        </div>
                        <Button 
                          className={cn("w-full h-11 rounded-xl text-[10px] font-bold tracking-widest uppercase", sosStatus?.sosTrigger && sosStatus?.triggeredByNode === node.id ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90")}
                          onClick={() => triggerNodeAlert(node)}
                        >
                          <Zap className="h-4 w-4 mr-2" /> 
                          {sosStatus?.sosTrigger && sosStatus?.triggeredByNode === node.id ? "Reset Alert" : "Trigger SOS"}
                        </Button>
                        <div className="flex gap-2 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-9 rounded-lg text-[10px] font-bold uppercase tracking-widest flex-1" onClick={() => { setItemToView(node); setIsViewItemDialogOpen(true); }}><Eye className="h-3.5 w-3.5 mr-2" /> View</Button>
                          <Button variant="ghost" size="sm" className="h-9 rounded-lg text-[10px] font-bold uppercase tracking-widest flex-1" onClick={() => { setItemToEdit(node); setIsEditNodeDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</Button>
                          <Button variant="ghost" size="sm" className="h-9 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => { setItemToDelete({ ...node, type: 'node' }); setIsDeleteDialogOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold tracking-tight">Safety Ledger</h1>
              <Card className="glass-card border-none overflow-hidden">
                <ScrollArea className="h-[500px] p-6">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 opacity-20">
                      <Bell className="h-12 w-12 mb-4" />
                      <p className="text-xs font-bold uppercase tracking-widest">Clear Queue</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="mb-6 pb-6 border-b border-white/5 last:border-0 last:mb-0">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-bold">{n.message}</p>
                          <Badge variant="outline" className="text-[9px] opacity-60">{new Date(n.createdAt).toLocaleTimeString()}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-md space-y-8">
              <h1 className="text-3xl font-bold tracking-tight">System Config</h1>
              <Card className="glass-card border-none p-8 space-y-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">Session ID</p>
                  <p className="text-[10px] font-mono opacity-60 truncate">{user.uid}</p>
                </div>
                <Button variant="destructive" onClick={() => signOut(auth).then(() => router.push("/login"))} className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-[0.2em]">
                  <LogOut className="h-4 w-4 mr-2" /> Terminate Session
                </Button>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isAddBuddyDialogOpen} onOpenChange={setIsAddBuddyDialogOpen}>
        <DialogContent className="glass-card border-none rounded-3xl max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold uppercase tracking-wider">Enlist Buddy</DialogTitle></DialogHeader>
          <form onSubmit={handleRegisterBuddy} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Identity</Label>
              <Input value={buddyForm.name} onChange={e => setBuddyForm({...buddyForm, name: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Comms Number</Label>
              <Input value={buddyForm.phoneNumber} onChange={e => setBuddyForm({...buddyForm, phoneNumber: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Protocol Groups</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                {buddyGroups.map(g => (
                  <div key={g} className="flex items-center gap-2.5">
                    <Checkbox checked={buddyForm.groups.includes(g)} onCheckedChange={() => {
                      const updated = buddyForm.groups.includes(g) ? buddyForm.groups.filter(x => x !== g) : [...buddyForm.groups, g];
                      setBuddyForm({...buddyForm, groups: updated});
                    }} className="rounded-md border-white/20" />
                    <span className="text-[10px] font-bold opacity-70">{g}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest" disabled={registerLoading}>
              {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Asset"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditBuddyDialogOpen} onOpenChange={setIsEditBuddyDialogOpen}>
        <DialogContent className="glass-card border-none rounded-3xl max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold uppercase tracking-wider">Modify Buddy</DialogTitle></DialogHeader>
          {itemToEdit && (
            <form onSubmit={handleUpdateBuddy} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Identity</Label>
                <Input value={itemToEdit.name} onChange={e => setItemToEdit({...itemToEdit, name: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Comms Number</Label>
                <Input value={itemToEdit.phoneNumber} onChange={e => setItemToEdit({...itemToEdit, phoneNumber: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Protocol Groups</Label>
                <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                  {buddyGroups.map(g => (
                    <div key={g} className="flex items-center gap-2.5">
                      <Checkbox checked={itemToEdit.groups?.includes(g)} onCheckedChange={() => {
                        const groups = itemToEdit.groups || [];
                        const updated = groups.includes(g) ? groups.filter((x: string) => x !== g) : [...groups, g];
                        setItemToEdit({...itemToEdit, groups: updated});
                      }} className="rounded-md border-white/20" />
                      <span className="text-[10px] font-bold opacity-70">{g}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest" disabled={registerLoading}>
                {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddNodeDialogOpen} onOpenChange={setIsAddNodeDialogOpen}>
        <DialogContent className="glass-card border-none rounded-3xl max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold uppercase tracking-wider">Arm Node</DialogTitle></DialogHeader>
          <form onSubmit={handleRegisterNode} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Node Alias</Label>
              <Input value={nodeForm.nodeName} onChange={e => setNodeForm({...nodeForm, nodeName: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Hardware ID</Label>
              <Input value={nodeForm.hardwareId} onChange={e => setNodeForm({...nodeForm, hardwareId: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Alert Targets</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                {buddyGroups.map(g => (
                  <div key={g} className="flex items-center gap-2.5">
                    <Checkbox checked={nodeForm.targetGroups.includes(g)} onCheckedChange={() => {
                      const updated = nodeForm.targetGroups.includes(g) ? nodeForm.targetGroups.filter(x => x !== g) : [...nodeForm.targetGroups, g];
                      setNodeForm({...nodeForm, targetGroups: updated});
                    }} className="rounded-md border-white/20" />
                    <span className="text-[10px] font-bold opacity-70">{g}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest" disabled={registerLoading}>
              {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditNodeDialogOpen} onOpenChange={setIsEditNodeDialogOpen}>
        <DialogContent className="glass-card border-none rounded-3xl max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold uppercase tracking-wider">Modify Node</DialogTitle></DialogHeader>
          {itemToEdit && (
            <form onSubmit={handleUpdateNode} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Node Alias</Label>
                <Input value={itemToEdit.nodeName} onChange={e => setItemToEdit({...itemToEdit, nodeName: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Hardware ID</Label>
                <Input value={itemToEdit.hardwareId} onChange={e => setItemToEdit({...itemToEdit, hardwareId: e.target.value})} className="bg-white/5 border-white/10 rounded-xl h-12" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Alert Targets</Label>
                <div className="grid grid-cols-2 gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                  {buddyGroups.map(g => (
                    <div key={g} className="flex items-center gap-2.5">
                      <Checkbox checked={itemToEdit.targetGroups?.includes(g)} onCheckedChange={() => {
                        const targets = itemToEdit.targetGroups || [];
                        const updated = targets.includes(g) ? targets.filter((x: string) => x !== g) : [...targets, g];
                        setItemToEdit({...itemToEdit, targetGroups: updated});
                      }} className="rounded-md border-white/20" />
                      <span className="text-[10px] font-bold opacity-70">{g}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest" disabled={registerLoading}>
                {registerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Configuration"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewItemDialogOpen} onOpenChange={setIsViewItemDialogOpen}>
        <DialogContent className="glass-card border-none rounded-3xl max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold uppercase tracking-wider">System Audit</DialogTitle></DialogHeader>
          {itemToView && (
            <div className="space-y-6 pt-4">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4">Core Metadata</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold opacity-40">Alias</span>
                    <span className="text-xs font-bold">{itemToView.nodeName || itemToView.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold opacity-40">System ID</span>
                    <span className="text-[10px] font-mono opacity-80">{itemToView.hardwareId || itemToView.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold opacity-40">Status</span>
                    <Badge className={cn("text-[9px]", itemToView.status === 'online' ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground")}>{itemToView.status || 'Active'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold opacity-40">Enlisted</span>
                    <span className="text-[10px] opacity-60">{new Date(itemToView.registeredAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-4">Protocol Groupings</p>
                <div className="flex flex-wrap gap-2">
                  {(itemToView.targetGroups || itemToView.groups || []).map((g: string) => (
                    <Badge key={g} variant="outline" className="bg-white/5 border-white/10 text-[9px] px-3 py-1 opacity-80">{g}</Badge>
                  ))}
                  {(itemToView.targetGroups || itemToView.groups || []).length === 0 && <p className="text-[10px] opacity-40 uppercase font-bold">No active protocols</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isManageGroupsDialogOpen} onOpenChange={setIsManageGroupsDialogOpen}>
        <DialogContent className="glass-card border-none rounded-3xl max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold uppercase tracking-wider">Protocol Hub</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex gap-2">
              <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group Name" className="bg-white/5 border-white/10 rounded-xl h-12 text-xs font-bold" />
              <Button onClick={() => {
                if (!user || !newGroupName) return;
                push(ref(rtdb, `users/${user.uid}/buddyGroups`), { name: newGroupName });
                setNewGroupName("");
              }} className="h-12 w-12 rounded-xl p-0"><PlusCircle className="h-5 w-5" /></Button>
            </div>
            <ScrollArea className="h-60">
              <div className="space-y-2 pr-4">
                {buddyGroups.map(g => (
                  <div key={g} className="p-4 bg-white/5 rounded-xl flex justify-between items-center group/item">
                    <span className="text-xs font-bold">{g}</span>
                    {!DEFAULT_BUDDY_GROUPS.includes(g) && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-destructive opacity-0 group-hover/item:opacity-100" onClick={() => {
                        const gId = Object.entries(customGroupsData || {}).find(([k, v]: any) => v.name === g)?.[0];
                        if (gId) remove(ref(rtdb, `users/${user.uid}/buddyGroups/${gId}`));
                      }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="glass-card border-none rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold uppercase tracking-wider">Purge Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This asset will be permanently erased from the safety network.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="rounded-xl font-bold text-[10px] uppercase tracking-widest">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!user || !itemToDelete) return;
              const path = itemToDelete.type === 'buddy' ? `users/${user.uid}/buddies/${itemToDelete.id}` : `users/${user.uid}/nodes/${itemToDelete.id}`;
              remove(ref(rtdb, path)).then(() => {
                setIsDeleteDialogOpen(false);
                setItemToDelete(null);
              });
            }} className="rounded-xl font-bold text-[10px] uppercase tracking-widest bg-destructive">Purge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
