import React, { useCallback, useState } from "react";
import { View, Text, Button, TextInput, Alert, ActivityIndicator } from "react-native";
import { theme } from "@/theme";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function ScanCustomer() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState("");

  const normalizeForRoute = (input: string) => {
    const trimmed = String(input ?? "").trim();
    const cleaned = trimmed.replace(/\u200B/g, "").toUpperCase();
    const alnum = cleaned.replace(/[^A-Z0-9]/g, "");
    if (alnum.length === 8) return `${alnum.slice(0, 4)}-${alnum.slice(4)}`;
    return cleaned;
  };

  const onResult = useCallback((code: string) => {
    setScanned(true);
    const normalized = normalizeForRoute(code);
    router.push(`/(admin)/client/${encodeURIComponent(normalized)}`);
    setTimeout(() => setScanned(false), 800);
  }, []);

  if (!permission) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ color: theme.colors.sub, marginTop: 8 }}>Initialisation caméra…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
          Accès caméra requis
        </Text>
        <Text style={{ color: theme.colors.sub, textAlign: "center", marginBottom: 16 }}>
          Autorise la caméra pour scanner le QR des clients.
        </Text>
        <Button title="Autoriser la caméra" onPress={requestPermission} />
        <View style={{ height: 20 }} />
        <Text style={{ color: theme.colors.sub, marginBottom: 8 }}>Ou saisis le code client :</Text>
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
        <Button title="Ouvrir" onPress={() => (manual ? onResult(manual) : Alert.alert("Code requis"))} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 0.65,
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
            scanned
              ? undefined
              : ({ data }) => {
                  if (typeof data === "string" && data.trim().length > 0) {
                    onResult(String(data));
                  }
                }
          }
        />
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}>Ou saisie manuelle</Text>
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
            backgroundColor: theme.colors.card,
          }}
        />
        <Button title="Ouvrir fiche" onPress={() => (manual ? onResult(manual) : Alert.alert("Code requis"))} />
      </View>
    </View>
  );
}
