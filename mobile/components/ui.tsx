import { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
export const C={navy:"#10264B",blue:"#2457D6",bg:"#F4F7FC",ink:"#17243A",muted:"#68758A",border:"#DFE6F0",white:"#FFFFFF",red:"#B42318",green:"#13845B"};
export const S=StyleSheet.create({
 page:{flexGrow:1,padding:20,paddingBottom:40,backgroundColor:C.bg},
 title:{fontSize:27,fontWeight:"800",color:C.navy,marginBottom:6},
 subtitle:{fontSize:14,color:C.muted,lineHeight:21,marginBottom:18},
 card:{backgroundColor:C.white,borderRadius:15,borderWidth:1,borderColor:C.border,padding:15,marginBottom:12},
 label:{fontSize:13,fontWeight:"700",color:C.ink,marginTop:10,marginBottom:6},
 input:{borderWidth:1,borderColor:C.border,backgroundColor:C.white,borderRadius:11,paddingHorizontal:13,paddingVertical:12,fontSize:15,color:C.ink},
 button:{backgroundColor:C.blue,borderRadius:11,padding:15,alignItems:"center",marginTop:15},
 buttonText:{color:C.white,fontWeight:"800",fontSize:14},
 link:{color:C.blue,fontWeight:"700",textAlign:"center",marginTop:17},
 muted:{color:C.muted,fontSize:13,lineHeight:20},
 error:{color:C.red,backgroundColor:"#FDEDEC",padding:10,borderRadius:9,marginTop:10},
 row:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},
 chip:{borderWidth:1,borderColor:C.border,borderRadius:20,paddingHorizontal:11,paddingVertical:8,marginRight:7,marginBottom:7},
 chipActive:{backgroundColor:"#E9EFFF",borderColor:C.blue},
});
export function Field({label,...props}:TextInputProps & {label:string}) {
 return <View style={{marginBottom:9}}><Text style={S.label}>{label}</Text><TextInput placeholderTextColor="#98A3B3" {...props} style={[S.input,props.multiline&&{minHeight:90,textAlignVertical:"top"},props.style]}/></View>;
}
export function Button({title,onPress,busy,disabled}:{title:string;onPress:()=>void;busy?:boolean;disabled?:boolean}) {
 return <Pressable onPress={onPress} disabled={busy||disabled} style={[S.button,(busy||disabled)&&{opacity:.55}]}><View style={S.row}>{busy?<ActivityIndicator color="white"/>:null}<Text style={S.buttonText}>{busy?"PLEASE WAIT":title}</Text></View></Pressable>;
}
export function Page({children}:PropsWithChildren) { return <ScrollView contentContainerStyle={S.page} keyboardShouldPersistTaps="handled">{children}</ScrollView>; }
export function ErrorText({children}:{children?:string}) { return children?<Text style={S.error}>{children}</Text>:null; }