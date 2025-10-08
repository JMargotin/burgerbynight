import { PointTx } from "@/constants/PointTx";
import {
  addPointsByAmount,
  fetchCoupons,
  fetchPointTransactions,
  getUserByCustomerCode,
  getUserProfile,
  markCouponUsed,
} from "@/lib/store";
import { theme } from "@/theme";
import type { Coupon } from "@/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Button,
  Modal,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ClientSheet() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<PointTx[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [amount, setAmount] = useState("");
  const [scanCouponVisible, setScanCouponVisible] = useState(false);

  // expo-camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedOnce, setScannedOnce] = useState(false); // évite double scan dans le modal
  const [isScanningCoupon, setIsScanningCoupon] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [manualCouponCode, setManualCouponCode] = useState("");
  const [cameraHeight] = useState(new Animated.Value(0.7));
  const [isProcessingCoupon, setIsProcessingCoupon] = useState(false); // évite les appels multiples

  // Animation pour la hauteur de la caméra dans le modal
  React.useEffect(() => {
    Animated.timing(cameraHeight, {
      toValue: isInputFocused ? 0.4 : 0.7,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isInputFocused, cameraHeight]);

  const normalizedCode = (() => {
    const raw = String(code ?? "");
    const trimmed = raw.trim();
    const cleaned = trimmed.replace(/\u200B/g, "").toUpperCase();
    const alnum = cleaned.replace(/[^A-Z0-9]/g, "");
    if (alnum.length === 8) return `${alnum.slice(0, 4)}-${alnum.slice(4)}`;
    return cleaned;
  })();

  async function load() {
    setLoading(true);
    try {
      // 1) trouver le client
      const u = await getUserByCustomerCode(String(code));
      console.log("u", u);
      if (!u) {
        setUser(null);
        Alert.alert("Introuvable", "Aucun client pour ce code.");
        return;
      }

      // 2) profil & balance immédiatement (NE JETTE PAS L’UI SI LA SUITE ÉCHOUE)
      const profile = await getUserProfile(u.uid);
      const effectiveUser = profile || u;
      setUser(effectiveUser);
      setBalance(
        typeof effectiveUser.balance === "number" ? effectiveUser.balance : 0
      );

      // 3) charger tx/coupons sans bloquer l’UI si ça échoue
      try {
        const [txs, cps] = await Promise.all([
          fetchPointTransactions(effectiveUser.uid, 100),
          fetchCoupons(effectiveUser.uid),
        ]);
        setTx(txs);
        setCoupons(cps);
      } catch (e: any) {
        console.warn(
          "Chargement historique/coupons a échoué:",
          e?.message ?? e
        );
        // On garde au moins la fiche client visible
        setTx([]);
        setCoupons([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [normalizedCode]);

  async function onAddPoints() {
    if (!user) return;
    const euros = Number(amount.replace(",", "."));
    if (Number.isNaN(euros) || euros <= 0) {
      Alert.alert("Montant invalide", "Entre un montant en euros (> 0).");
      return;
    }
    const pts = await addPointsByAmount(user.uid, euros, "Achat");
    Alert.alert("Points ajoutés", `+${pts} pts pour ${euros.toFixed(2)}€`);
    setAmount("");
    await load();
  }

  const onRedeemCouponByCode = useCallback(
    async (code: string) => {
      if (isProcessingCoupon) {
        console.log("⚠️ Validation déjà en cours, ignoré");
        return; // Évite les appels multiples
      }

      setIsProcessingCoupon(true);
      try {
        await markCouponUsed(code.trim(), user.uid);
        Alert.alert("Coupon validé", "Le coupon a été marqué comme utilisé.");
        await load();
      } catch (e: any) {
        Alert.alert("Impossible de valider", e?.message ?? "Erreur");
      } finally {
        setIsProcessingCoupon(false);
      }
    },
    [user, isProcessingCoupon]
  );

  async function openScanner() {
    // Demande la permission caméra avant d'ouvrir le modal
    if (!permission || !permission.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          "Caméra refusée",
          "Autorise la caméra pour scanner les coupons, ou saisis le code manuellement."
        );
        // on ouvre quand même le modal: on affichera un fallback
      }
    }
    setScannedOnce(false);
    setIsScanningCoupon(true);
    setIsInputFocused(false);
    setManualCouponCode("");
    setIsProcessingCoupon(false);
    setScanCouponVisible(true);
  }

  function closeScannerModal() {
    // Réinitialise tous les états liés au scanner avant de fermer
    setScannedOnce(false);
    setIsScanningCoupon(true);
    setIsInputFocused(false);
    setManualCouponCode("");
    setIsProcessingCoupon(false);
    setScanCouponVisible(false);
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: theme.colors.text }}>Client introuvable.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        padding: 16,
        gap: 16,
      }}
    >
      {/* Header client */}
      <View
        style={{
          backgroundColor: theme.colors.card,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          style={{ color: theme.colors.text, fontSize: 18, fontWeight: "800" }}
        >
          {user.displayName || user.email}
        </Text>
        <Text style={{ color: theme.colors.sub }}>
          Code: {user.customerCode}
        </Text>
        <Text style={{ color: theme.colors.sub, marginTop: 6 }}>
          Solde:{" "}
          <Text style={{ color: theme.colors.neon, fontWeight: "800" }}>
            {balance} pts
          </Text>
        </Text>
      </View>

      {/* Actions */}
      <View
        style={{
          backgroundColor: theme.colors.card,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: 12,
        }}
      >
        <Text
          style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}
        >
          Ajouter des points
        </Text>
        <Text style={{ color: theme.colors.sub }}>1€ = 1 point</Text>
        <TextInput
          placeholder="Montant € (ex: 24.90)"
          placeholderTextColor="#666"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={{
            color: theme.colors.text,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            backgroundColor: theme.colors.bg,
          }}
        />
        <Button title="Ajouter" onPress={onAddPoints} />

        <View style={{ height: 10 }} />

        <Text
          style={{ color: theme.colors.text, fontSize: 16, fontWeight: "700" }}
        >
          Valider un coupon
        </Text>
        <Button title="Scanner un coupon" onPress={openScanner} />
      </View>

      {/* Historique points */}
      <View
        style={{
          backgroundColor: theme.colors.card,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Transactions
        </Text>
        {tx.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>Aucune transaction.</Text>
        ) : (
          tx.map((t, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: theme.colors.text, fontWeight: "600" }}>
                {t.delta > 0 ? `+${t.delta}` : `${t.delta}`} pts
              </Text>
              <Text style={{ color: theme.colors.sub, flex: 1, marginLeft: 8 }}>
                {t.reason || ""}
              </Text>
              <Text style={{ color: theme.colors.sub }}>
                {t.createdAt?.toDate
                  ? t.createdAt.toDate().toLocaleString()
                  : ""}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Coupons list */}
      <View
        style={{
          backgroundColor: theme.colors.card,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Coupons
        </Text>
        {coupons.length === 0 ? (
          <Text style={{ color: theme.colors.sub }}>Aucun coupon.</Text>
        ) : (
          coupons.map((c) => (
            <View
              key={c.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: theme.colors.text }}>
                {c.title} • {c.type}
              </Text>
              <Text
                style={{
                  color:
                    c.status === "active"
                      ? theme.colors.success
                      : theme.colors.sub,
                }}
              >
                {c.status}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Modal Scanner Coupon (expo-camera) */}
      <Modal
        visible={scanCouponVisible}
        animationType="slide"
        onRequestClose={() => closeScannerModal()}
      >
        <View
          style={{ flex: 1, backgroundColor: theme.colors.bg, padding: 16 }}
        >
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 12,
            }}
          >
            Scanner le coupon
          </Text>

          {/* Permission non accordée → CTA + fallback */}
          {permission && !permission.granted ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: theme.colors.sub, marginBottom: 12 }}>
                Autorise la caméra pour scanner le coupon.
              </Text>
              <Button title="Autoriser la caméra" onPress={requestPermission} />
              <View style={{ height: 20 }} />
              <Button title="Fermer" onPress={() => closeScannerModal()} />
            </View>
          ) : (
            <>
              <Animated.View
                style={{
                  flex: cameraHeight,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  marginBottom: 16,
                }}
              >
                <CameraView
                  style={{ width: "100%", height: "100%" }}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={
                    !isScanningCoupon || scannedOnce
                      ? undefined
                      : ({ data }) => {
                          if (
                            typeof data === "string" &&
                            data.trim() &&
                            !isProcessingCoupon
                          ) {
                            setScannedOnce(true);
                            setIsScanningCoupon(false);
                            closeScannerModal();
                            onRedeemCouponByCode(String(data));
                          }
                        }
                  }
                />
              </Animated.View>

              {/* Champ de saisie manuelle */}
              <View style={{ gap: 10 }}>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  Ou saisie manuelle
                </Text>
                <TextInput
                  placeholder="Code du coupon"
                  placeholderTextColor="#666"
                  value={manualCouponCode}
                  onChangeText={setManualCouponCode}
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
                  title={
                    isProcessingCoupon
                      ? "Validation en cours..."
                      : "Valider le coupon"
                  }
                  disabled={isProcessingCoupon}
                  onPress={() => {
                    if (manualCouponCode.trim() && !isProcessingCoupon) {
                      closeScannerModal();
                      onRedeemCouponByCode(manualCouponCode.trim());
                    } else if (!manualCouponCode.trim()) {
                      Alert.alert(
                        "Code requis",
                        "Veuillez saisir un code de coupon."
                      );
                    }
                  }}
                />
              </View>

              <View style={{ height: 16 }} />

              {!isScanningCoupon && (
                <Button
                  title="Réactiver le scanner"
                  onPress={() => {
                    setIsScanningCoupon(true);
                    setScannedOnce(false);
                  }}
                />
              )}

              <Button title="Fermer" onPress={() => closeScannerModal()} />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}
