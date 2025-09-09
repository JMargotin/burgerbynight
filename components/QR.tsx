import React from "react";
import { View, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { theme } from "@/theme";

type Props = {
  value: string;
  label?: string;
  size?: number;
};

export default function QR({ value, label, size = 220 }: Props) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        padding: theme.pad,
        borderRadius: theme.radius,
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      {label ? (
        <Text style={{ color: theme.colors.sub, marginBottom: 8 }}>
          {label}
        </Text>
      ) : null}
      <View style={{ backgroundColor: "#fff", padding: 10, borderRadius: 12 }}>
        <QRCode value={value} size={size} />
      </View>
      <Text
        style={{ color: theme.colors.text, marginTop: 12, fontWeight: "600" }}
      >
        {value}
      </Text>
    </View>
  );
}
