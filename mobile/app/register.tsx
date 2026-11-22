import { useState } from "react";
import { Alert, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { api,saveSession,User } from "../lib/api";
import { Button,ErrorText,Field,Page,S } from "../components/ui";
export default function Register(){
 const [f,setF]=useState({name:"",email:"",password:"",companyName:"",phone:""});const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const set=(k:keyof typeof f,v:string)=>setF(p=>({...p,[k]:v}));
 async function submit(){
  if(!f.name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)||f.password.length<8){setError("Name, valid email and password of at least 8 characters are required.");return;}
  setBusy(true);setError("");
  try{const r=await api<{token:string;user:User}>("/auth/register",undefined,{method:"POST",body:JSON.stringify(f)});await saveSession(r.token,r.user);router.replace("/(tabs)/dashboard");}
  catch(e){setError(e instanceof Error?e.message:"Registration failed.");}finally{setBusy(false);}
 }
 return <Page><Text style={S.title}>Create account</Text><Text style={S.subtitle}>Register as a CoverBridge customer. Broker and admin roles are assigned securely by an administrator.</Text><Field label="Full name" value={f.name} onChangeText={v=>set("name",v)}/><Field label="Email address" value={f.email} onChangeText={v=>set("email",v)} autoCapitalize="none" keyboardType="email-address"/><Field label="Password (8+ characters)" value={f.password} onChangeText={v=>set("password",v)} secureTextEntry/><Field label="Company name" value={f.companyName} onChangeText={v=>set("companyName",v)}/><Field label="Phone" value={f.phone} onChangeText={v=>set("phone",v)} keyboardType="phone-pad"/><ErrorText>{error}</ErrorText><Button title="CREATE ACCOUNT" onPress={submit} busy={busy}/><Pressable onPress={()=>router.replace("/login")}><Text style={S.link}>Already registered? Sign in</Text></Pressable></Page>;
}