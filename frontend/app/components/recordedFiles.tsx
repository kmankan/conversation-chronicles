import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ENV } from "../config";
import { useAuth } from "@clerk/clerk-expo";

// Custom theme colors
const themeColors = {
  matteBlue: "#2C3E50",
  lightBlue: "#34495E",
  orange: "#E67E22",
  lightOrange: "#F39C12",
  white: "#FFFFFF",
  darkGray: "#1a1a1a",
  borderColor: "rgba(255, 255, 255, 0.3)",
};

// interface for the audio file
interface Recording {
  id: string;
  createdAt: string;
  title: string;
  duration?: number;
  topics?: string[];
}

export function RecordedFiles() {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setError(null);
      const token = await getToken();
      const response = await fetch(`${ENV.prod}/recordings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setRecordings(data.data);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      setError("Failed to load recordings, please retry");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchRecordings();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "--:--";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Your Recordings</Text>
      {isLoading && !refreshing && (
        <ActivityIndicator size="large" color={themeColors.orange} />
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {recordings.map((recording: Recording) => (
        <TouchableOpacity key={recording.id} style={styles.fileItem}>
          <Ionicons name="musical-note" size={24} color={themeColors.orange} />

          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{recording.title}</Text>
            <Text style={styles.fileDate}>
              {formatDate(recording.createdAt)}
            </Text>
          </View>

          <View style={styles.rightContainer}>
            <TouchableOpacity style={styles.playButtonContainer}>
              <Ionicons name="play" size={24} color={themeColors.orange} />
            </TouchableOpacity>
            <Text style={styles.duration}>
              {formatDuration(recording.duration)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: themeColors.matteBlue,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: themeColors.white,
    letterSpacing: 1,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: themeColors.lightBlue,
    borderWidth: 1,
    borderColor: themeColors.borderColor,
    shadowColor: themeColors.white,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: themeColors.white,
    letterSpacing: 0.5,
  },
  fileDate: {
    fontSize: 12,
    marginTop: 4,
    color: themeColors.white + "80",
    letterSpacing: 0.5,
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonContainer: {
    padding: 8,
    backgroundColor: `${themeColors.lightBlue}40`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.borderColor,
  },
  duration: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    color: themeColors.white + "80",
    letterSpacing: 0.5,
  },
  errorText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
    color: themeColors.orange,
    letterSpacing: 0.5,
  },
});
