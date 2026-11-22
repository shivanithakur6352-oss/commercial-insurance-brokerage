import { useState } from "react";
import { Alert, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { api } from "../lib/api";
import { Button, ErrorText, Field, Page, S } from "../components/ui";
export default function Login(){
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function submit(){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||password.length<8){setError("Enter a valid email and password (at least 8 characters).");return;}
  setBusy(true);setError("");
  try{const r=await api<{requiresOtp:boolean;email:string;message:string}>("/auth/login",undefined,{method:"POST",body:JSON.stringify({email:email.trim().toLowerCase(),password})});if(r.requiresOtp)router.push({pathname:"/verify-login",params:{email:r.email||email.trim().toLowerCase()}});else setError("Unexpected response from sign-in service.");}
  catch(e){setError(e instanceof Error?e.message:"Unable to sign in.");}finally{setBusy(false);}
 }
 return <Page><Text style={{color:"#2457D6",fontWeight:"800",letterSpacing:2,marginTop:30}}>COMMERCIAL INSURANCE</Text><Text style={[S.title,{fontSize:35,marginTop:8}]}>CoverBridge</Text><Text style={S.subtitle}>Sign in to your secure business insurance workspace.</Text><Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="name@company.com"/><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password"/><ErrorText>{error}</ErrorText><Button title="CONTINUE" onPress={submit} busy={busy}/><Pressable onPress={()=>router.push("/forgot-password")}><Text style={S.link}>Forgot password?</Text></Pressable><Pressable onPress={()=>router.push("/register")}><Text style={S.link}>Create a customer account</Text></Pressable></Page>;
}