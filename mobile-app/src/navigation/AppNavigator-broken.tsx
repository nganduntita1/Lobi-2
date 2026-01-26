import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, BorderRadius } from '../theme/colors';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import CartScraperScreen from '../screens/CartScraperScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminOrdersScreen from '../screens/AdminOrdersScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Icon Component
const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
    <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
  </View>
);

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 8,
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.xl,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          paddingBottom: 0,
          borderTopWidth: 0,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={CartScraperScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🛍️" label="Shop" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📦" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreeColors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          elevation: 8,
          backgroundColor: Colors.surface,
          borderRadius: BorderRadius.xl,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          paddingBottom: 0,
          borderTopWidth: 0,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          )
      />
      <Tab.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => null,
        }}
      />
    </Tab.Navigator>
  );
}


const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
  },
  iconContainerActive: {
    backgroundColor: Colors.primaryLight,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
export default function AppNavigator() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : isAdmin ? (
        <AdminTabs />
      ) : (
        <CustomerTabs />
      )}
    </NavigationContainer>
  );
}
