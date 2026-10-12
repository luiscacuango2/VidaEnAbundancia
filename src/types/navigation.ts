// src/types/navigation.ts

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  VolumeDetail: {
    volumeId: string;
    volumeTitle: string;
  };
  LessonDetail: {
    lessonId: string;
    lessonTitle: string;
  };
};