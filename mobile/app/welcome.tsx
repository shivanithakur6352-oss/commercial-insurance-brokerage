import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Button, Page, S, C } from "../components/ui";

const portals = [
  { role: "customer", title: "Customer Portal", detail: "Submit and track your business insurance enquiries." },
  { role: "broker", title: "Broker Portal", detail: "Review customer requirements and manage quotations." },
  { role: "admin", title: "Admin Portal", detail: "Manage users, enquiries and platform operations." },
] as const;

export default function Welcome() {
  return (
    <Page contentContainerStyle={{ paddingTop: 28 }}>
      <View style={{ marginBottom: 26 }}>
        <Text style={{ color: C.blue, fontSize: 13, fontWeight: "800", letterSpacing: 2 }}>COMMERCIAL INSURANCE</Text>
        <Text style={{ color: C.navy, fontSize: 38, fontWeight: "900", letterSpacing: -1, marginTop: 5 }}>CoverBridge</Text>
      </View>

      <View style={{ backgroundColor: C.navy, borderRadius: 22, padding: 22, marginBottom: 22 }}>
        <Text style={{ color: "#BFD0FF", fontWeight: "800", fontSize: 11, letterSpacing: 1.4 }}>COMMERCIAL INSURANCE, SIMPLIFIED</Text>
        <Text style={{ color: C.white, fontSize: 31, lineHeight: 37, fontWeight: "900", marginTop: 14 }}>Protect Your Business.{"\n"}<Text style={{ color: "#AFC5FF" }}>Focus on Growth.</Text></Text>
        <Text style={{ color: "#E0E8F8", fontSize: 15, lineHeight: 23, marginTop: 13 }}>Discover business insurance solutions with expert broker assistance. Submit your requirements, track enquiries and receive quotations in one place.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
          {["D&O Insurance", "Cyber Liability", "Key-Person Insurance"].map(tag => <View key={tag} style={{ borderWidth: 1, borderColor: "#52698F", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 }}><Text style={{ color: C.white, fontSize: 11, fontWeight: "700" }}>{tag}</Text></View>)}
        </View>
      </View>

      <Text style={S.title}>Choose Your Portal</Text>
      <Text style={S.subtitle}>Sign in to continue to your CoverBridge workspace.</Text>
      {portals.map((portal, index) => (
        <Pressable key={portal.role} onPress={() => router.push({ pathname: "/login", params: { portal: portal.role } })} style={[S.card, { borderColor: index === 0 ? C.blue : C.border, borderWidth: index === 0 ? 1.5 : 1 }]}>
          <Text style={{ color: C.navy, fontWeight: "800", fontSize: 17 }}>{portal.title}</Text>
          <Text style={[S.muted, { marginTop: 5 }]}>{portal.detail}</Text>
          <Text style={{ color: C.blue, fontWeight: "800", marginTop: 12 }}>SIGN IN  →</Text>
        </Pressable>
      ))}
      <Button title="CREATE A CUSTOMER ACCOUNT" onPress={() => router.push("/register")} />
      <Pressable onPress={() => router.push("/login")}><Text style={S.link}>Already have an account? Sign in</Text></Pressable>
      <Text style={[S.muted, { textAlign: "center", marginTop: 24 }]}>CoverBridge · Broker-assisted commercial insurance enquiries</Text>
    </Page>
  );
}
