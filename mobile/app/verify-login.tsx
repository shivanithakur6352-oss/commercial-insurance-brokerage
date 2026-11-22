import { useState } from "react";
import { Text } from "react-native";
import { router,useLocalSearchParams } from "expo-router";
import { api,saveSession,User } from "../lib/api";
import { Button,ErrorText,Field,Page,S } from "../components/ui";
export default function VerifyLogin(){
 const {email}=useLocalSearchParams<{email:string}>();const [otp,setOtp]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function verify(){if(!/^\d{6}$/.test(otp)){setError("Enter the 6-digit OTP.");return;}setBusy(true);setError("");try{const r=await api<{token:string;user:User}>("/auth/verify-login-otp",undefined,{method:"POST",body:JSON.stringify({email,otp})});await saveSession(r.token,r.user);router.replace("/(tabs)/dashboard");}catch(e){setError(e instanceof Error?e.message:"OTP verification failed.");}finally{setBusy(false);}}
 return <Page><Text style={S.title}>Verify your email</Text><Text style={S.subtitle}>Enter the six-digit login code sent to {email}. The code expires after 10 minutes.</Text><Field label="Login OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="000000"/><ErrorText>{error}</ErrorText><Button title="VERIFY & SIGN IN" onPress={verify} busy={busy}/></Page>;
}