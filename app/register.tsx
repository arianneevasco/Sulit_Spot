import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Full name is required.";
    else if (name.trim().length < 2) e.name = "Name is too short.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 6) e.password = "At least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: await authService.register(name, email, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setErrors({ email: err.message || "Registration failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* ── Header ── */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Sulit Spot</Text>
          <Text style={styles.tagline}>Find it. Share it. Save together.</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Your name"
            placeholderTextColor="#BDBDBD"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="yourname@gmail.com"
            placeholderTextColor="#BDBDBD"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="at least 6 characters"
            placeholderTextColor="#BDBDBD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Link href="/login" asChild>
              <Text style={styles.linkText}>Login</Text>
            </Link>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PRIMARY = "#4ECBA4";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flexGrow: 1,
  },

  /* Hero */
  hero: {
    backgroundColor: PRIMARY,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 48,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoWrap: {
    marginBottom: 16,
  },

  /* Header */
  header: {
    backgroundColor: PRIMARY,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 48,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginTop: 8,
    fontWeight: "400",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },

  /* Form */
  form: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#222",
    backgroundColor: "#FAFAFA",
  },
  inputError: {
    borderColor: "#E53935",
  },
  errorText: {
    fontSize: 11,
    color: "#E53935",
    marginTop: 4,
  },

  /* Buttons */
  primaryBtn: {
    height: 50,
    backgroundColor: "#222",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  switchText: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 13,
    color: "#666",
  },
  linkText: {
    color: "#222",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
