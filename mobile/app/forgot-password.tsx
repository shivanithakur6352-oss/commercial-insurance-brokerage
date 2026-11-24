import { useState } from "react";
import { Text,Pressable } from "react-native";
import { router } from "expo-router";
import { api } from "../lib/api";
import { Button,ErrorText,Field,Page,S } from "../components/ui";
export default function ForgotPassword(){
 const [email,setEmail]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function send(){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError("Enter a valid email address.");return;}setBusy(true);setError("");try{const r=await api<{message:string}>("/auth/forgot-password",undefined,{method:"POST",body:JSON.stringify({email})});router.push({pathname:"/reset-password",params:{email}});}catch(e){setError(e instanceof Error?e.message:"Could not request reset OTP.");}finally{setBusy(false);}}
 return <Page><Text style={S.title}>Forgot password</Text><Text style={S.subtitle}>Enter your registered email. If an account exists, a reset OTP will be sent.</Text><Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/><ErrorText>{error}</ErrorText><Button title="SEND RESET OTP" onPress={send} busy={busy}/><Pressable onPress={()=>router.replace("/login")}><Text style={S.link}>Back to sign in</Text></Pressable></Page>;
}