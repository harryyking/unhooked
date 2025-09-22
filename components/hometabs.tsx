import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import NavHeader from './nav-header'; // Your refactored NavHeader
import { TodayScreen, CommunityScreen } from './screens'; // Your screens

// SceneMap efficiently renders only the active tab's scene
const renderScene = SceneMap({
  today: TodayScreen,
  community: CommunityScreen,
});

export default function HomeTabs() {
  const layout = useWindowDimensions();

  // State for the TabView
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'today', title: 'Today' },
    { key: 'community', title: 'Accountability' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      // Use our custom, theme-aware NavHeader as the tab bar
      renderTabBar={props => <NavHeader {...props} />}
    />
  );
}