import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, View
} from "react-native";
import { api, clearSession, readSession, saveSession, User } from "../lib/api";

type Enquiry = {
  _id: string;
  companyName: string;
  industry: string;
  insuranceType: string;
  status: string;
  customer?: { name?: string; email?: string };
  quotation?: { insurer?: string; indicativePremium?: string };
};
type Overview = Record<string, number>;

const blue = "#2457D6";

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [tab, setTab] = useState("Overview");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "", phone: "" });
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [quotations, setQuotations] = useState<Enquiry[]>([]);
  const [riskData, setRiskData] = useState<any>(null);
  const [newEnquiry, setNewEnquiry] = useState({
    companyName: "", industry: "", insuranceType: "D&O", country: "India", coverageNotes: ""
  });

  useEffect(() => {
    readSession().then(async session => {
      if (session) {
        setToken(session.token);
        setUser(session.user);
        await loadDashboard(session.token, session.user);
      }
    }).catch(e => setMessage(e.message)).finally(() => setLoading(false));
  }, []);

  async function loadDashboard(t = token, u = user) {
    if (!t || !u) return;
    try {
      if (u.role === "admin") {
        const [o, us, es, qs, rp] = await Promise.all([
          api<Overview>("/admin/overview", t),
          api<{ users: User[] }>("/admin/users", t),
          api<{ enquiries: Enquiry[] }>("/admin/enquiries", t),
          api<{ quotations: Enquiry[] }>("/admin/quotations", t),
          api<any>("/admin/risk-passports", t)
        ]);
        setOverview(o); setUsers(us.users || []); setEnquiries(es.enquiries || []);
        setQuotations(qs.quotations || []); setRiskData(rp);
      } else if (u.role === "broker") {
        const [es, o, rp] = await Promise.all([
          api<{ enquiries: Enquiry[] }>("/enquiries", t),
          api<Overview>("/dashboard/summary", t),
          api<any>("/risk-passport", t)
        ]);
        setEnquiries(es.enquiries || []); setOverview(o); setRiskData(rp);
      } else {
        const es = await api<{ enquiries: Enquiry[] }>("/enquiries/mine", t);
        setEnquiries(es.enquiries || []);
        const rp = await api<any>("/risk-passport", t);
        setRiskData(rp);
      }
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not load dashboard");
    }
  }

  async function authenticate() {
    setBusy(true); setMessage("");
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const data = await api<{ token: string; user: User }>(path, undefined, {
        method: "POST",
        body: JSON.stringify(form)
      });
      await saveSession(data.token, data.user);
      setToken(data.token); setUser(data.user);
      await loadDashboard(data.token, data.user);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Authentication failed");
    } finally { setBusy(false); }
  }

  async function logout() {
    await clearSession(); setToken(""); setUser(null);
    setOverview(null); setUsers([]); setEnquiries([]); setQuotations([]);
    setTab("Overview");
  }

  async function createEnquiry() {
    setBusy(true);
    try {
      await api("/enquiries", token, { method: "POST", body: JSON.stringify(newEnquiry) });
      Alert.alert("Enquiry submitted", "Your enquiry has been sent to the CoverBridge team.");
      setNewEnquiry({ companyName: "", industry: "", insuranceType: "D&O", country: "India", coverageNotes: "" });
      await loadDashboard();
      setTab("Enquiries");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not submit enquiry"); }
    finally { setBusy(false); }
  }

  async function changeStatus(id: string, status: string) {
    try {
      await api(`/enquiries/${id}/status`, token, { method: "PATCH", body: JSON.stringify({ status }) });
      await loadDashboard();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not update status"); }
  }

  function field(label: string, key: keyof typeof form, secure = false) {
    return (
      <View style={styles.field} key={key}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={form[key]}
          onChangeText={value => setForm(current => ({ ...current, [key]: value }))}
          secureTextEntry={secure}
          autoCapitalize={key === "email" ? "none" : "sentences"}
          keyboardType={key === "email" ? "email-address" : "default"}
          placeholder={label}
        />
      </View>
    );
  }

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={blue} /></SafeAreaView>;

  if (!user) return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.authWrap} keyboardShouldPersistTaps="handled">
        <View style={styles.brandMark}><Text style={styles.brandLetter}>C</Text></View>
        <Text style={styles.brand}>CoverBridge</Text>
        <Text style={styles.subtitle}>COMMERCIAL INSURANCE</Text>
        <Text style={styles.heading}>{mode === "login" ? "Welcome back" : "Create your account"}</Text>
        <Text style={styles.muted}>Sign in to manage your commercial insurance workspace.</Text>
        {mode === "register" && field("Full name", "name")}
        {field("Email address", "email")}
        {field("Password (minimum 8 characters)", "password", true)}
        {mode === "register" && field("Company name", "companyName")}
        {mode === "register" && field("Phone", "phone")}
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Button title={busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"} onPress={authenticate} disabled={busy} />
        <Pressable onPress={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
          <Text style={styles.link}>{mode === "login" ? "New to CoverBridge? Create an account" : "Already registered? Sign in"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );

  const tabs = user.role === "admin"
    ? ["Overview", "Users", "Enquiries", "Quotations", "Risk Passports"]
    : user.role === "broker"
      ? ["Overview", "Enquiries", "Risk Passports"]
      : ["Overview", "Enquiries", "New Enquiry", "Risk Passport"];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <View><Text style={styles.brand}>CoverBridge</Text><Text style={styles.small}>{user.name} · {user.role}</Text></View>
        <Pressable onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Sign out</Text></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {tabs.map(item => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
          <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
        </Pressable>)}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR WORKSPACE</Text>
        <Text style={styles.pageTitle}>{tab}</Text>
        {message ? <Text style={styles.error}>{message}</Text> : null}

        {tab === "Overview" && <>
          <Text style={styles.muted}>Welcome to CoverBridge, {user.name}.</Text>
          {overview ? <View style={styles.grid}>
            {Object.entries(overview).map(([key, value]) => <View style={styles.stat} key={key}>
              <Text style={styles.statLabel}>{key.replace(/([A-Z])/g, " $1")}</Text>
              <Text style={styles.statValue}>{value}</Text>
            </View>)}
          </View> : <Text style={styles.muted}>Your workspace is ready.</Text>}
          <Text style={styles.sectionTitle}>Recent enquiries</Text>
          {enquiries.slice(0, 5).map(item => <EnquiryCard key={item._id} item={item} />)}
        </>}

        {tab === "Users" && users.map(item => <View style={styles.card} key={item.id}>
          <Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.muted}>{item.email} · {item.role}</Text>
        </View>)}

        {tab === "Enquiries" && <>
          {enquiries.map(item => <View key={item._id}>
            <EnquiryCard item={item} />
            {user.role === "broker" || user.role === "admin" ? <View style={styles.actions}>
              {["under_review", "quote_ready", "closed"].map(status => <Pressable key={status} style={styles.action} onPress={() => changeStatus(item._id, status)}>
                <Text style={styles.actionText}>{status.replace("_", " ")}</Text>
              </Pressable>)}
            </View> : null}
          </View>)}
          {!enquiries.length ? <Text style={styles.muted}>No enquiries yet.</Text> : null}
        </>}

        {tab === "New Enquiry" && <View style={styles.card}>
          <Text style={styles.sectionTitle}>Submit an insurance enquiry</Text>
          <TextInput style={styles.input} placeholder="Company name" value={newEnquiry.companyName} onChangeText={v => setNewEnquiry(s => ({...s, companyName:v}))} />
          <TextInput style={styles.input} placeholder="Industry" value={newEnquiry.industry} onChangeText={v => setNewEnquiry(s => ({...s, industry:v}))} />
          <Text style={styles.label}>Insurance type</Text>
          <View style={styles.actions}>{["D&O", "Cyber Liability", "Key-Person"].map(x => <Pressable key={x} style={[styles.action, newEnquiry.insuranceType === x && styles.actionActive]} onPress={() => setNewEnquiry(s => ({...s, insuranceType:x}))}><Text style={styles.actionText}>{x}</Text></Pressable>)}</View>
          <TextInput style={styles.input} placeholder="Coverage notes (optional)" value={newEnquiry.coverageNotes} onChangeText={v => setNewEnquiry(s => ({...s, coverageNotes:v}))} multiline />
          <Button title="Submit enquiry" onPress={createEnquiry} disabled={busy || !newEnquiry.companyName || !newEnquiry.industry} />
        </View>}

        {(tab === "Risk Passport" || tab === "Risk Passports") && <View style={styles.card}>
          <Text style={styles.sectionTitle}>Risk Passport</Text>
          <Text style={styles.muted}>Your backend Risk Passport service is connected. The full questionnaire and broker/admin insights are the next migration screen.</Text>
          <Text style={styles.bodyText}>{riskData?.passport ? `Saved profile: ${riskData.passport.companyType} · score ${riskData.passport.score}/100` : riskData?.total !== undefined ? `Profiles: ${riskData.total} · average score: ${riskData.averageScore}/100` : "No saved Risk Passport profile found."}</Text>
        </View>}

        {tab === "Quotations" && quotations.map(item => <View style={styles.card} key={item._id}>
          <Text style={styles.cardTitle}>{item.companyName}</Text>
          <Text style={styles.muted}>{item.quotation?.insurer || "Insurer pending"} · {item.quotation?.indicativePremium || "Premium pending"}</Text>
        </View>)}
        <Text style={styles.footer}>CoverBridge · Secure commercial insurance workspace</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Button({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={[styles.button, disabled && { opacity: 0.55 }]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}

function EnquiryCard({ item }: { item: Enquiry }) {
  return <View style={styles.card}>
    <Text style={styles.cardTitle}>{item.companyName}</Text>
    <Text style={styles.muted}>{item.industry} · {item.insuranceType}</Text>
    <Text style={styles.status}>{(item.status || "submitted").replace("_", " ")}</Text>
    {item.customer?.name ? <Text style={styles.small}>Customer: {item.customer.name}</Text> : null}
    {item.quotation?.insurer ? <Text style={styles.small}>Insurer: {item.quotation.insurer}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F8FD" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  authWrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  brandMark: { width: 48, height: 48, borderRadius: 14, backgroundColor: blue, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  brandLetter: { color: "white", fontWeight: "800", fontSize: 24 },
  brand: { color: "#17243A", fontWeight: "800", fontSize: 23 },
  subtitle: { color: "#6A7890", fontSize: 10, letterSpacing: 2, marginBottom: 32 },
  heading: { color: "#17243A", fontWeight: "800", fontSize: 28, marginBottom: 8 },
  pageTitle: { color: "#17243A", fontWeight: "800", fontSize: 28, marginBottom: 14 },
  muted: { color: "#68758A", lineHeight: 21, marginBottom: 12 },
  field: { marginTop: 14 },
  label: { color: "#394A63", fontWeight: "600", marginBottom: 7 },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: "#DCE5F1", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12, color: "#17243A" },
  button: { backgroundColor: blue, borderRadius: 11, padding: 15, alignItems: "center", marginTop: 10 },
  buttonText: { color: "white", fontWeight: "800" },
  link: { color: blue, textAlign: "center", marginTop: 22, fontWeight: "700" },
  error: { color: "#B42318", backgroundColor: "#FEECEB", padding: 12, borderRadius: 9, marginVertical: 10 },
  topbar: { paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderColor: "#E1E8F2", flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "white" },
  small: { color: "#68758A", fontSize: 12, marginTop: 4 },
  logout: { borderWidth: 1, borderColor: "#DCE5F1", borderRadius: 9, paddingVertical: 9, paddingHorizontal: 13 },
  logoutText: { color: blue, fontWeight: "700" },
  tabs: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  tab: { borderWidth: 1, borderColor: "#DCE5F1", borderRadius: 20, paddingVertical: 9, paddingHorizontal: 13, backgroundColor: "white" },
  activeTab: { backgroundColor: blue, borderColor: blue },
  tabText: { color: "#394A63", fontWeight: "600" },
  activeTabText: { color: "white" },
  content: { padding: 18, paddingBottom: 48 },
  eyebrow: { color: blue, fontWeight: "800", fontSize: 10, letterSpacing: 2, marginBottom: 7 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 12 },
  stat: { backgroundColor: "white", borderRadius: 13, borderWidth: 1, borderColor: "#E1E8F2", padding: 14, minWidth: "47%", flexGrow: 1 },
  statLabel: { color: "#68758A", fontSize: 12, textTransform: "capitalize" },
  statValue: { color: "#17243A", fontWeight: "800", fontSize: 25, marginTop: 7 },
  sectionTitle: { color: "#17243A", fontWeight: "800", fontSize: 18, marginTop: 12, marginBottom: 10 },
  card: { backgroundColor: "white", borderRadius: 14, borderWidth: 1, borderColor: "#E1E8F2", padding: 15, marginBottom: 11 },
  cardTitle: { color: "#17243A", fontSize: 16, fontWeight: "800", marginBottom: 5 },
  status: { color: blue, textTransform: "capitalize", fontWeight: "700", marginTop: 5 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 12 },
  action: { borderWidth: 1, borderColor: "#DCE5F1", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 11, backgroundColor: "white" },
  actionActive: { borderColor: blue, backgroundColor: "#EAF0FF" },
  actionText: { color: blue, fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  bodyText: { color: "#394A63", lineHeight: 22, marginTop: 8 },
  footer: { color: "#8A96A8", textAlign: "center", fontSize: 11, marginTop: 26 }
});