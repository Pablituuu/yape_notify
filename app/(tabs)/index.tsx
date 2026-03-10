import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppTheme } from "@/context/ThemeContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as Speech from "expo-speech";
import RNAndroidNotificationListener from "react-native-android-notification-listener";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [isActive, setIsActive] = useState(false);
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("male");
  const { isDark, toggleTheme } = useAppTheme();

  // Color selection remains same...
  const activeColor = useThemeColor({}, "success");
  const inactiveColor = useThemeColor({}, "error");
  const cardColor = useThemeColor({}, "card");
  const iconColor = useThemeColor({}, "text");
  const primaryColor = useThemeColor({}, "primary");

  // Effect to handle notifications
  useEffect(() => {
    let interval: any;

    if (isActive) {
      // En un APK real, esto corre por detrás.
      // Por ahora, vamos a registrar el listener.
      console.log("Servicio iniciado...");
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const speakTest = async () => {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const spanishVoices = voices.filter((v) => v.language.startsWith("es"));

      // Intentar encontrar una voz que coincida con el género
      const selectedVoice =
        spanishVoices.find((v) => {
          const name = v.name.toLowerCase();
          if (voiceGender === "female") {
            return (
              name.includes("female") ||
              name.includes("monic") ||
              name.includes("paul") ||
              name.includes("helena") ||
              name.includes("femen")
            );
          } else {
            return (
              name.includes("male") ||
              name.includes("jorge") ||
              name.includes("diego") ||
              name.includes("pablo") ||
              name.includes("ricardo") ||
              name.includes("mascul")
            );
          }
        }) || spanishVoices[0];

      Speech.speak("Hola soy Pablito", {
        language: "es-ES",
        // Mujer (restaurada a natural): 1.0
        // Hombre (el que debe ser varonil/grave): 0.7
        pitch: voiceGender === "female" ? 1.0 : 0.7,
        rate: voiceGender === "male" ? 0.9 : 1.0,
        voice: selectedVoice?.identifier,
      });
    } catch (e) {
      Speech.speak("Hola soy Pablito", {
        language: "es-ES",
        pitch: voiceGender === "female" ? 1.0 : 0.7,
        rate: voiceGender === "male" ? 0.9 : 1.0,
      });
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const progress = useDerivedValue(() => {
    return withSpring(isActive ? 1 : 0);
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [inactiveColor, activeColor],
      ),
      transform: [{ scale: withSpring(isActive ? 1.05 : 1) }],
      shadowColor: interpolateColor(
        progress.value,
        [0, 1],
        [inactiveColor, activeColor],
      ),
      shadowOpacity: withSpring(isActive ? 0.6 : 0.3),
      shadowRadius: withSpring(isActive ? 15 : 5),
    };
  });

  const toggleService = async () => {
    console.log(
      "Intentando cambiar estado del servicio. Estado actual (isActive):",
      isActive,
    );

    // Solo comprobamos si intentamos ACTIVAR el servicio
    if (!isActive) {
      console.log(
        "Activando servicio... comprobando permisos de notificación.",
      );

      // SEGURIDAD: Comprobar si el módulo existe (no existe en Expo Go)
      if (!RNAndroidNotificationListener) {
        console.warn("Notification listener no disponible (Expo Go detected)");
        Alert.alert(
          "Modo Simulación",
          "Estás usando Expo Go. La detección real de Yape solo funcionará cuando generemos el APK final. Por ahora, usaré el modo de prueba.",
          [{ text: "Entendido" }],
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
            "Para que Pablito pueda detectar pagos de Yape, debes habilitar el acceso a notificaciones.",
            [
              { text: "Ahora no", style: "cancel" },
              {
                text: "Ir a Ajustes",
                onPress: () =>
                  (RNAndroidNotificationListener as any).requestPermission(),
              },
            ],
          );
          return;
        }
      } catch (e) {
        console.error("Error al obtener permisos:", e);
      }
    }

    setIsActive(!isActive);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  /**
   * EL CEREBRO: Procesa el texto de la notificación y extrae Nombre y Monto
   */
  const parseYapeNotification = (text: string) => {
    let cleanText = text.replace("Yape!", "").trim();
    let name = "Alguien";
    let amount = "0";

    if (cleanText.includes("te envió un pago por S/")) {
      // Extraer nombre (todo lo que está antes de "te envió")
      const namePart = cleanText.split("te envió")[0].trim();
      // Tomar solo el primer nombre
      name = namePart.split(" ")[0];

      // Extraer monto (lo que está entre "S/" y el siguiente espacio o punto)
      const amountMatch = cleanText.match(/S\/\s?([0-9.,]+)/);
      if (amountMatch) {
        amount = amountMatch[1];
      }
    }

    return { name, amount };
  };

  /**
   * FUNCIÓN MÁGICA: Simula la llegada de un Yape real
   */
  const simulateYape = (type: 1 | 2) => {
    if (!isActive) {
      Alert.alert(
        "Servicio Apagado",
        "Primero activa el servicio con el botón central.",
      );
      return;
    }

    const messages = {
      1: "Anilu Esc* te envió un pago por S/ 1. El cód. de seguridad es: 979",
      2: "Yape! Pablito Jean Pool Silva Inca te envió un pago por S/ 1.00",
    };

    const { name, amount } = parseYapeNotification(messages[type]);

    // Convertir el monto a palabras simples si es necesario (opcional)
    const speechText = `¡Atención! Has recibido un Yape de ${name} por ${amount} soles.`;

    Speech.speak(speechText, {
      language: "es-ES",
      pitch: voiceGender === "female" ? 1.0 : 0.7,
      rate: 0.9,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topControls}>
        <TouchableOpacity
          style={[styles.testVoiceButton, { backgroundColor: cardColor }]}
          onPress={speakTest}
        >
          <IconSymbol name="speaker.wave.3.fill" size={22} color={iconColor} />
          <ThemedText style={styles.testVoiceText}>Pablito Voice</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.themeToggle, { backgroundColor: cardColor }]}
          onPress={() => {
            toggleTheme();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <IconSymbol
            name={isDark ? "sun.max.fill" : "moon.fill"}
            size={22}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.plus}>+</ThemedText>
          <Image
            source={require("@/assets/images/yape-logo-fondo-transparente.png")}
            style={styles.yapeLogo}
            contentFit="contain"
          />
        </View>
        <ThemedText type="title" style={styles.title}>
          Yape Notify
        </ThemedText>
        <ThemedText style={styles.description}>
          Detecta automáticamente tus pagos de Yape y mantén el control de tus
          ingresos al instante.
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {isActive ? "Servicio Activo 📡" : "Servicio Desactivado 🛑"}
        </ThemedText>
      </View>

      <View style={styles.voiceSelectionContainer}>
        <ThemedText style={styles.voiceSelectionTitle}>
          Preferencia de Voz
        </ThemedText>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              { backgroundColor: cardColor },
              voiceGender === "male" && {
                borderColor: primaryColor,
                borderWidth: 2,
              },
            ]}
            onPress={() => {
              setVoiceGender("male");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol
              name="person.fill"
              size={20}
              color={voiceGender === "male" ? primaryColor : iconColor}
            />
            <ThemedText
              style={[
                styles.genderText,
                voiceGender === "male" && { color: primaryColor },
              ]}
            >
              Hombre
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              { backgroundColor: cardColor },
              voiceGender === "female" && {
                borderColor: primaryColor,
                borderWidth: 2,
              },
            ]}
            onPress={() => {
              setVoiceGender("female");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol
              name="person.2.fill"
              size={20}
              color={voiceGender === "female" ? primaryColor : iconColor}
            />
            <ThemedText
              style={[
                styles.genderText,
                voiceGender === "female" && { color: primaryColor },
              ]}
            >
              Mujer
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.centerSection}>
        <Animated.View style={[styles.glowContainer, animatedButtonStyle]}>
          <TouchableOpacity
            onPress={toggleService}
            activeOpacity={0.8}
            style={styles.mainButton}
          >
            <ThemedText style={styles.buttonText}>
              {isActive ? "OFF" : "ON"}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ThemedView style={[styles.infoCard, { backgroundColor: cardColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.infoTitle}>
          Estado del Sistema
        </ThemedText>
        <ThemedText style={styles.infoDescription}>
          {isActive
            ? "Escuchando notificaciones de Yape en tiempo real..."
            : "Pulsa el botón para comenzar a detectar pagos."}
        </ThemedText>

        {/* BOTONES DE SIMULACIÓN PARA PRUEBAS */}
        <View style={{ gap: 10, width: "100%", marginTop: 15 }}>
          <TouchableOpacity
            style={[styles.simulateButton, { borderColor: primaryColor }]}
            onPress={() => simulateYape(1)}
          >
            <ThemedText style={{ color: primaryColor }}>
              Simular Anilu (Formato 1) 💸
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.simulateButton, { borderColor: primaryColor }]}
            onPress={() => simulateYape(2)}
          >
            <ThemedText style={{ color: primaryColor }}>
              Simular Pablito (Formato 2) 💸
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: width * 0.9,
    marginTop: 10,
  },
  testVoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 10,
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  testVoiceText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 30,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 15,
  },
  logo: {
    width: 80,
    height: 80,
  },
  yapeLogo: {
    width: 70,
    height: 70,
  },
  plus: {
    fontSize: 24,
    opacity: 0.5,
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 10,
  },
  description: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.6,
    lineHeight: 20,
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  voiceSelectionContainer: {
    alignItems: "center",
    width: width * 0.9,
    marginVertical: 10,
  },
  voiceSelectionTitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 10,
    fontWeight: "600",
  },
  genderRow: {
    flexDirection: "row",
    gap: 15,
  },
  genderButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    gap: 10,
    minWidth: 120,
    justifyContent: "center",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  centerSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glowContainer: {
    width: width * 0.45, // Reducido de 0.6 a 0.45
    height: width * 0.45,
    borderRadius: width * 0.225,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  mainButton: {
    width: "100%",
    height: "100%",
    borderRadius: width * 0.225,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  buttonText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
  },
  infoCard: {
    width: width * 0.9,
    padding: 20,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  infoTitle: {
    fontSize: 16,
    marginBottom: 5,
  },
  infoDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
  simulateButton: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
