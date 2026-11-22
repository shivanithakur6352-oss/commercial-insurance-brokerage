import { useCallback,useState } from "react";
import { Alert,Pressable,Text,View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api,readSession,User } from "../../lib/api";
import { Page,S,C } from "../../components/ui";
export default function AdminUsers(){
 const [users,setUsers]=useState<User[]>([]);
 const load=async()=>{const s=await readSession();if(!s||s.user.role!=="admin")return;const r=await api<{users:User[]}>("/admin/users",s.token);setUsers(r.users||[]);};
 useFocusEffect(useCallback(()=>{load().catch(e=>Alert.alert("Error",e.message));},[]));
 async function setRole(user:User,role:User["role"]){try{const s=await readSession();if(!s)return;await api(`/admin/users/${user.id}/role`,s.token,{method:"PATCH",body:JSON.stringify({role})});await load();}catch(e){Alert.alert("Role update failed",e instanceof Error?e.message:"Try again");}}
 return <Page><Text style={S.title}>User management</Text><Text style={S.subtitle}>Assign customer, broker or admin roles. The backend prevents self-demotion and removal of the last administrator.</Text>{users.map(u=><View style={S.card} key={u.id}><Text style={{fontWeight:"800",color:C.navy}}>{u.name}</Text><Text style={S.muted}>{u.email}</Text><Text style={[S.label,{color:C.blue}]}>Current role: {u.role}</Text><View style={{flexDirection:"row",flexWrap:"wrap"}}>{(["customer","broker","admin"] as const).filter(r=>r!==u.role).map(r=><Pressable key={r} onPress={()=>Alert.alert("Change role",`Change ${u.name} to ${r}?`,[{text:"Cancel",style:"cancel"},{text:"Confirm",onPress:()=>setRole(u,r)}])} style={S.chip}><Text style={{color:C.blue}}>Make {r}</Text></Pressable>)}</View></View>)}</Page>;
}