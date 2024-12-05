import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import { AudioWaveform } from "./AudioWaveform";
import * as FileSystem from "expo-file-system";
import { useTheme } from "@react-navigation/native";

interface AudioRecorderProps {
  onRecordingComplete?: (uri: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
}) => {
  const { colors } = useTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    setupAudio();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error("Audio setup failed:", error);
    }
  };

  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Start recording failed:", error);
    }
  };

  const pauseRecording = async () => {
    if (!recording) return;
    try {
      await recording.pauseAsync();
      setIsPaused(true);
    } catch (error) {
      console.error("Pause recording failed:", error);
    }
  };

  const resumeRecording = async () => {
    if (!recording) return;
    try {
      await recording.startAsync();
      setIsPaused(false);
    } catch (error) {
      console.error("Resume recording failed:", error);
    }
  };

  const convertAudioToBase64 = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("Converted to base64");
      return base64;
    } catch (error) {
      console.error("Error converting audio:", error);
      throw error;
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      setRecording(null);

      if (uri) {
        console.log("Original recording at:", uri);
        const base64Data = await convertAudioToBase64(uri);
        console.log("File converted successfully");

        if (onRecordingComplete) {
          onRecordingComplete(uri);
        }
      }
    } catch (error) {
      console.error("Stop recording failed:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <AudioWaveform isRecording={isRecording && !isPaused} />
      <View style={styles.controlsContainer}>
        {!isRecording ? (
          <RecordButton onPress={startRecording} colors={colors} />
        ) : (
          <RecordingControls
            isPaused={isPaused}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onStop={stopRecording}
            colors={colors}
          />
        )}
      </View>
    </View>
  );
};

interface ControlButtonProps {
  onPress: () => void;
  label: string;
  color: string;
  textColor?: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onPress,
  label,
  color,
  textColor = "#fff",
}) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
  </TouchableOpacity>
);

interface RecordButtonProps {
  onPress: () => void;
  colors: any;
}

const RecordButton: React.FC<RecordButtonProps> = ({ onPress, colors }) => (
  <ControlButton onPress={onPress} label="Record" color={colors.primary} />
);

interface RecordingControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  colors: any;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isPaused,
  onPause,
  onResume,
  onStop,
  colors,
}) => (
  <>
    {!isPaused ? (
      <ControlButton
        onPress={onPause}
        label="Pause"
        color={colors.notification}
      />
    ) : (
      <ControlButton onPress={onResume} label="Resume" color={colors.primary} />
    )}
    <ControlButton
      onPress={onStop}
      label="End"
      color={colors.error || "#f44336"}
    />
  </>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});