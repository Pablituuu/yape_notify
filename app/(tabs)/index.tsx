import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
} from "react-native";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/Themed";
import { useAppTheme } from "@/context/ThemeContext";
import RNAndroidNotificationListener from "react-native-android-notification-listener";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [isActive, setIsActive] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("male");
  const { isDark, toggleTheme, theme } = useAppTheme();

  // Notification Handler
  useEffect(() => {
    if (isActive) {
      console.log("Service Active: Waiting for notifications...");
    }
  }, [isActive]);

  const parseYapeNotification = (text: string) => {
    let cleanText = text.replace("Yape!", "").trim();
    let name = "Alguien";
    let amount = "0";

    if (cleanText.includes("te envió un pago por S/")) {
      const namePart = cleanText.split("te envió")[0].trim();
      name = namePart.split(" ")[0];
      const amountMatch = cleanText.match(/S\/\s?([0-9.,]+)/);
      if (amountMatch) amount = amountMatch[1];
    }
    return { name, amount };
  };

  const announcePayment = (name: string, amount: string) => {
    const text = `¡Atención! Has recibido un Yape de ${name} por ${amount} soles.`;
    Speech.speak(text, {
      language: "es-ES",
      pitch: voiceGender === "female" ? 1.0 : 0.7,
      rate: 0.9,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const simulateYape = (type: 1 | 2) => {
    if (!isActive) {
      Alert.alert("Servicio Apagado", "Activa el servicio para simular.");
      return;
    }
    const msg =
      type === 1
        ? "Anilu Esc* te envió un pago por S/ 1. El cód. de seguridad es: 979"
        : "Yape! Pablito Jean Pool Silva Inca te envió un pago por S/ 1.00";

    const { name, amount } = parseYapeNotification(msg);
    announcePayment(name, amount);
  };

  const toggleService = async () => {
    if (!isActive) {
      if (!RNAndroidNotificationListener) {
        Alert.alert(
          "Modo Simulación",
          "Escucha real desactivada en este entorno.",
        );
        setIsActive(true);
        return;
      }

      try {
        const status = await (
          RNAndroidNotificationListener as any
        ).getPermissionStatus();
        if (status !== "authorized") {
          Alert.alert(
            "Permiso Requerido",
            "Habilita el acceso a notificaciones para Pablito.",
            [
              { text: "Cancelar" },
              {
                text: "Ajustes",
                onPress: () =>
                  (RNAndroidNotificationListener as any).requestPermission(),
              },
            ],
          );
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsActive(!isActive);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme}>
          <FontAwesome5
            name={isDark ? "sun" : "moon"}
            size={20}
            color={isDark ? "#FACC15" : "#1E293B"}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? "#F1F5F9" : "#1E293B" }]}>
          YAPE NOTIFY
        </Text>
        <Text style={styles.statusText}>
          {isActive ? "✓ SERVICIO ACTIVO" : "✗ SERVICIO INACTIVO"}
        </Text>
      </View>

      {/* Main Button */}
      <View style={styles.center}>
        <TouchableOpacity
          onPress={toggleService}
          style={[
            styles.mainButton,
            {
              backgroundColor: isActive ? "#22C55E" : "#EF4444",
              shadowColor: isActive ? "#22C55E" : "#EF4444",
            },
          ]}
        >
          <MaterialCommunityIcons name="power" size={60} color="#FFF" />
          <Text style={styles.powerText}>{isActive ? "ON" : "OFF"}</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences */}
      <View style={styles.preferences}>
        <Text style={[styles.label, { color: isDark ? "#94A3B8" : "#64748B" }]}>
          VOZ DE PABLITO
        </Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              voiceGender === "male" && styles.activeGender,
            ]}
            onPress={() => setVoiceGender("male")}
          >
            <FontAwesome5
              name="male"
              size={20}
              color={voiceGender === "male" ? "#FFF" : "#64748B"}
            />
            <Text
              style={[
                styles.genderLabel,
                { color: voiceGender === "male" ? "#FFF" : "#64748B" },
              ]}
            >
              Hombre
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              voiceGender === "female" && styles.activeGender,
            ]}
            onPress={() => setVoiceGender("female")}
          >
            <FontAwesome5
              name="female"
              size={20}
              color={voiceGender === "female" ? "#FFF" : "#64748B"}
            />
            <Text
              style={[
                styles.genderLabel,
                { color: voiceGender === "female" ? "#FFF" : "#64748B" },
              ]}
            >
              Mujer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Simulator */}
      <View
        style={[
          styles.simulator,
          { backgroundColor: isDark ? "#1E293B" : "#FFF" },
        ]}
      >
        <Text
          style={[styles.simTitle, { color: isDark ? "#F1F5F9" : "#1E293B" }]}
        >
          PRUEBA DE VOZ
        </Text>
        <View style={styles.simRow}>
          <TouchableOpacity
            style={styles.simBtn}
            onPress={() => simulateYape(1)}
          >
            <Text style={styles.simBtnText}>Anilu 💸</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.simBtn}
            onPress={() => simulateYape(2)}
          >
            <Text style={styles.simBtnText}>Pablito 💸</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  themeBtn: {
    position: "absolute",
    right: 0,
    top: 5,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
    opacity: 0.6,
  },
  center: {
    alignItems: "center",
  },
  mainButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  powerText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
  },
  preferences: {
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 15,
  },
  genderRow: {
    flexDirection: "row",
    gap: 15,
  },
  genderBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    gap: 10,
    minWidth: 125,
    justifyContent: "center",
  },
  activeGender: {
    backgroundColor: "#7C3AED",
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  simulator: {
    padding: 20,
    borderRadius: 20,
    elevation: 5,
  },
  simTitle: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 15,
    opacity: 0.7,
  },
  simRow: {
    flexDirection: "row",
    gap: 10,
  },
  simBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    alignItems: "center",
  },
  simBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },
});
