import { Client, Databases, Storage } from 'react-native-appwrite';

export const config = {
  platform: "com.luca.datetime",
  endpoint: "https://nyc.cloud.appwrite.io/v1",
  projectId: "68726a6e0016bfe4d311",
  databaseId: "6879556c000d0cf07ca4",
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

export const databases = new Databases(client);
export const storage = new Storage(client);
