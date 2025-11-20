import React from "react";
import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabHeight = 65 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0.5,
          borderTopColor: "#ddd",
          height: tabHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
        },
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={{
              color: "black",
              fontWeight: focused ? "700" : "500",
              fontSize: 13,
            }}
          >
            {children}
          </Text>
        ),
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "black",
      }}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color="black"
            />
          ),
        }}
      />

      {/* 🔍 Registrars */}
      <Tabs.Screen
        name="registrars"
        options={{
          title: "Registrars",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={26}
              color="black"
            />
          ),
        }}
      />

      {/* 🛍️ .KE Shop */}
      <Tabs.Screen
        name="shop"
        options={{
          title: ".KE Shop",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "shopping" : "shopping-outline"}
              size={26}
              color="black"
            />
          ),
        }}
      />

      {/* 🗞️ News */}
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "newspaper" : "newspaper-outline"}
              size={26}
              color="black"
            />
          ),
        }}
      />

      {/* 💬 Support */}
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={26}
              color="black"
            />
          ),
        }}
      />
    </Tabs>
  );
}
