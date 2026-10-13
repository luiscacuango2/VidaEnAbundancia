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
    volumeId: string;
    volumeTitle: string;
  };
  Quiz: {
    lessonId: string;
    lessonTitle: string;
    volumeId: string;
    volumeTitle: string;
  };
  Profile: undefined;
  Achievements: undefined;
};