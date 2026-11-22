import { useState } from "react";
import { Text } from "react-native";
import { router,useLocalSearchParams } from "expo-router";
import { api } from "../lib/api";
import { Button,ErrorText,Field,Page,S } from "../components/ui";
export default function ResetPassword(){
 const {email}=useLocalSearchParams<{email:string}>();const [otp,setOtp]=useState("");const [password,setPassword]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function reset(){if(!/^\d{6}$/.test(otp)||password.length<8){setError("Enter the 6-digit OTP and a password of at least 8 characters.");return;}setBusy(true);setError("");try{await api("/auth/reset-password",undefined,{method:"POST",body:JSON.stringify({email,otp,password})});router.replace("/login");}catch(e){setError(e instanceof Error?e.message:"Password reset failed.");}finally{setBusy(false);}}
 return <Page><Text style={S.title}>Set new password</Text><Text style={S.subtitle}>Enter the reset OTP sent to {email} and choose a new password.</Text><Field label="6-digit OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6}/><Field label="New password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry/><ErrorText>{error}</ErrorText><Button title="UPDATE PASSWORD" onPress={reset} busy={busy}/></Page>;
}