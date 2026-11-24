import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#10264B" },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "#2457D6",
        tabBarInactiveTintColor: "#7A8494",
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingTop: 5,
          paddingBottom: Math.max(insets.bottom, 7),
          backgroundColor: "#FFFFFF",
          borderTopColor: "#DFE6F0",
          borderTopWidth: 1,
          elevation: 12,
          zIndex: 10,
        },
        tabBarItemStyle: {
          minHeight: 50,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 1,
        },
        tabBarHideOnKeyboard: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="enquiries"
        options={{
          title: "Enquiries",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="quotations"
        options={{
          title: "Quotes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="risk-passport"
        options={{
          title: "Risk",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-users"
        options={{ href: null, title: "User management" }}
      />
    </Tabs>
  );
}
