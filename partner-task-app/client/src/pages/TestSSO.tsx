import React from 'react';
import { Box, VStack, Heading, Text, Badge } from '@chakra-ui/react';

const TestSSO: React.FC = () => {
  return (
    <Box maxW="md" mx="auto" mt={20} p={8} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={6}>
        <Heading size="lg" color="blue.500">
          ✅ SSO 测试页面
        </Heading>
        
        <Box p={4} bg="green.50" borderRadius="md" width="full">
          <Text fontSize="lg">
            Chakra UI 正常工作！
          </Text>
        </Box>

        <Badge colorScheme="blue" fontSize="md" p={3}>
          角色切换功能开发中
        </Badge>

        <Text color="gray.500" fontSize="sm">
          如果看到这个页面，说明 ChakraProvider 配置正确
        </Text>
      </VStack>
    </Box>
  );
};

export default TestSSO;
