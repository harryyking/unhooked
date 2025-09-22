import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './ui/text';

import { Bell, User } from 'lucide-react-native';
import { useTheme } from '@react-navigation/native';
import { NavigationState } from 'react-native-tab-view';

// The component now receives props from react-native-tab-view
const NavHeader = ({ navigationState, jumpTo }: {navigationState: NavigationState<{key: string, 
  title: string}>
, jumpTo: (key: string) => void}) => {
  const { colors } = useTheme(); // Hook to get theme colors

  return (
    <View className="bg-background flex-row items-center justify-between px-5 pt-2.5">
      {/* Left side: Navigation Links */}
      <View className="flex-row items-center gap-6">
        {navigationState.routes.map((route, i) => {
          const isActive = navigationState.index === i;
          return (
            <TouchableOpacity key={route.key} onPress={() => jumpTo(route.key)} className="items-center py-3">
              <Text
                className={`text-base font-medium ${
                  isActive ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {route.title}
              </Text>
              {/* Active indicator line */}
              {isActive && <View className="mt-2 h-[3px] w-full rounded-sm bg-foreground" />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right side: Icons */}
      <View className="flex-row items-center gap-5">
        <TouchableOpacity>
          <Bell size={24} color={colors.border} />
        </TouchableOpacity>
        <TouchableOpacity>
          <User size={24} color={colors.border} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NavHeader;