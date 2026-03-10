import React from 'react';
import { ChakraProvider, Box, VStack, Heading, Text, Badge } from '@chakra-ui/react';
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      500: '#1677ff',
    },
  },
});

const ChakraTest: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <Box maxW="md" mx="auto" mt={20} p={8} borderWidth={1} borderRadius="lg" bg="white">
        <VStack spacing={6}>
          <Heading size="lg" color="blue.500">
            ✅ Chakra UI 测试成功！
          </Heading>
          
          <Box p={4} bg="green.50" borderRadius="md" width="full">
            <Text fontSize="lg">
              Chakra UI 正常工作！
            </Text>
          </Box>

          <Badge colorScheme="blue" fontSize="md" p={3}>
            主题配置正确
          </Badge>

          <Text color="gray.500" fontSize="sm">
            现在可以访问 /sso-login 测试 SSO 功能
          </Text>
        </VStack>
      </Box>
    </ChakraProvider>
  );
};

export default ChakraTest;
