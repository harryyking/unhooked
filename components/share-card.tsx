import { StyleSheet, View, TouchableOpacity, Share, Alert, Image, ImageStyle } from 'react-native'
import { Text } from './ui/text'
import React, { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card'

import { Ionicons } from '@expo/vector-icons'
import { ChevronRight } from 'lucide-react-native'


const SHARE = {
  light: require('@/assets/images/unhooked-ios-icon-3.png'),
};

const SHARE_STYLE: ImageStyle = {
  height: 60,
  width: 66,
  resizeMode: 'contain',
};


const ShareCard = () => {
  const [copied, setCopied] = useState(false)
  
  // App store links - replace with your actual links
  const appLinks = {
    ios: 'https://apps.apple.com/app/unhooked/id123456789',
    android: 'https://play.google.com/store/apps/details?id=com.unhooked.app',
    website: 'https://unhooked.app'
  }
  
  const shareMessage = "Check out Unhooked - the app that's helping me build better digital habits! Download it here:"

  // const handleCopyLink = async () => {
  //   try {
  //     Clipboard.setString(appLinks.website)
  //     setCopied(true)
  //     setTimeout(() => setCopied(false), 2000)
  //   } catch (error) {
  //     Alert.alert('Error', 'Could not copy link to clipboard')
  //   }
  // }

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: `${shareMessage} ${appLinks.website}`,
        title: 'Share Unhooked App'
      })
    } catch (error) {
      Alert.alert('Error', 'Could not share at this time')
    }
  }

  return (
    <View className="mb-6">
     <Card className='mb-4 border-0  rounded-3xl shadow-none bg-secondary'>
        <CardHeader className='flex-row justify-between items-center'>
          <CardTitle variant={'small'} className='text-muted-foreground'>
            SHARE UNHOOKED
          </CardTitle>

        </CardHeader>
        <CardContent>
          <Image
          source={SHARE['light']}
          style={SHARE_STYLE}
          />
       
        </CardContent>
        <CardFooter className='flex gap-4'>
          <Text variant={'small'} className='font-medium'>
            SHARE THE APP
          </Text>
          <ChevronRight size={20} color={'#fff'}/>
        </CardFooter>
      </Card>
    </View>
  )
}

export default ShareCard

const styles = StyleSheet.create({
  shadowButton: {
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
})