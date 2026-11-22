import { Redirect } from "expo-router";
import { useEffect,useState } from "react";
import { ActivityIndicator,View } from "react-native";
import { readSession } from "../lib/api";
export default function Index(){
 const [destination,setDestination]=useState<"/login"|"/(tabs)/dashboard"|null>(null);
 useEffect(()=>{readSession().then(s=>setDestination(s?"/(tabs)/dashboard":"/login")).catch(()=>setDestination("/login"));},[]);
 if(!destination)return <View style={{flex:1,alignItems:"center",justifyContent:"center"}}><ActivityIndicator size="large" color="#2457D6"/></View>;
 return <Redirect href={destination}/>;
}