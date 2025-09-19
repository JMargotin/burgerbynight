import { theme } from "@/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Button,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ScanCustomer() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [cameraHeight] = useState(new Animated.Value(0.65));

  // Animation pour la hauteur de la caméra
  React.useEffect(() => {
    Animated.timing(cameraHeight, {
      toValue: isInputFocused ? 0.4 : 0.65,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isInputFocused, cameraHeight]);

  const normalizeForRoute = (input: string) => {
    const trimmed = String(input ?? "").trim();
    const cleaned = trimmed.replace(/\u200B/g, "").toUpperCase();
    const alnum = cleaned.replace(/[^A-Z0-9]/g, "");
    if (alnum.length === 8) return `${alnum.slice(0, 4)}-${alnum.slice(4)}`;
    return cleaned;
  };

  const onResult = useCallback(
    (code: string) => {
      if (scanned) return; // Éviter les scans multiples

      setScanned(true);
      setIsScanning(false); // Arrêter le scanner
      const normalized = normalizeForRoute(code);
      router.push(`/(admin)/client/${encodeURIComponent(normalized)}`);

      // Réinitialiser après un délai plus long
      setTimeout(() => {
        setScanned(false);
        setIsScanning(true);
      }, 2000);
    },
    [scanned]
  );

  if (!permission) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ color: theme.colors.sub, marginTop: 8 }}>
          Initialisation caméra…
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 10,
          }}
        >
          Accès caméra requis
        </Text>
        <Text
          style={{
            color: theme.colors.sub,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Autorise la caméra pour scanner le QR des clients.
        </Text>
        <Button title="Autoriser la caméra" onPress={requestPermission} />
        <View style={{ height: 20 }} />
        <Text style={{ color: theme.colors.sub, marginBottom: 8 }}>
          Ou saisis le code client :
        </Text>
        <TextInput
          placeholder="ABCD-1234"
          placeholderTextColor="#666"
          value={manual}
          onChangeText={setManual}
          style={{
            color: theme.colors.text,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            width: "100%",
            backgroundColor: theme.colors.card,
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          title="Ouvrir"
          onPress={() =>
            manual ? onResult(manual) : Alert.alert("Code requis")
          }
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          flex: cameraHeight,
          overflow: "hidden",
          borderRadius: 16,
          margin: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <CameraView
          style={{ width: "100%", height: "100%" }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={
            !isScanning || scanned
              ? undefined
              : ({ data }) => {
                  if (typeof data === "string" && data.trim().length > 0) {
                    onResult(String(data));
                  }
                }
          }
        />
      </Animated.View>

      <View style={{ padding: 16, gap: 10 }}>
        {!isScanning && (
          <View
            style={{
              backgroundColor: theme.colors.card,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 14,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              Scanner temporairement désactivé
            </Text>
            <Button
              title="Réactiver le scanner"
              onPress={() => {
                setIsScanning(true);
                setScanned(false);
              }}
            />
          </View>
        )}

        <Text
          style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}
        >
          Ou saisie manuelle
        </Text>
        <TextInput
          placeholder="ABCD-1234"
          placeholderTextColor="#666"
          value={manual}
          onChangeText={setManual}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          style={{
            color: theme.colors.text,
            borderColor: isInputFocused
              ? theme.colors.neon
              : theme.colors.border,
            borderWidth: isInputFocused ? 2 : 1,
            borderRadius: 12,
            padding: 12,
            backgroundColor: theme.colors.card,
            fontSize: 16,
            fontWeight: "600",
          }}
        />
        {isInputFocused && (
          <Text
            style={{
              color: theme.colors.sub,
              fontSize: 12,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            💡 Le scanner s'est réduit pour vous laisser de la place
          </Text>
        )}
        <Button
          title="Ouvrir fiche"
          onPress={() =>
            manual ? onResult(manual) : Alert.alert("Code requis")
          }
        />
      </View>
    </View>
  );
}
