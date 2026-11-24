import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { readSession } from "../lib/api";

export default function Index() {
  const [destination, setDestination] = useState<"/welcome" | "/(tabs)/dashboard" | null>(null);

  useEffect(() => {
    readSession()
      .then((session) => setDestination(session ? "/(tabs)/dashboard" : "/welcome"))
      .catch(() => setDestination("/welcome"));
  }, []);

  if (!destination) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color="#2457D6" /></View>;
  }

  return <Redirect href={destination} />;
}
