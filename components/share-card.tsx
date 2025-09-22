import { StyleSheet, View } from 'react-native'
import { Text } from './ui/text'
import React from 'react'
import { Card, CardContent } from './ui/card'

const ShareCard = () => {
  return (
    <View>
      <Card>
        <CardContent>
          <Text variant={'h4'}>Share your experience</Text>
        </CardContent>
        
      </Card>
    </View>
  )
}

export default ShareCard

const styles = StyleSheet.create({})