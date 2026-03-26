import GoogleProvider from "next-auth/providers/google";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        await connectDB();
        try {
          let existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            const randomPassword = Math.random().toString(36).slice(-10);
            existingUser = await User.create({
              name: user.name,
              email: user.email,
              password: randomPassword,
              role: 'patient',
              avatar: user.image,
            });
          }

          user.role = existingUser.role;
          user._id = existingUser._id;
          // Skip OTP for test accounts — go straight to portal
          const isTestAccount = existingUser.email.endsWith('@sanjeevni.com');
          if (existingUser.skipOTP || isTestAccount) {
            user.skipOTP = true; // Ensure session/jwt callbacks receive the bypass flag
            return true;
          }

          // Generate and send OTP for real Google users
          const { generateOTP, sendOTPEmail } = await import('@/lib/email');
          const otp = generateOTP();
          const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
          await User.updateOne({ _id: existingUser._id }, { $set: { otp, otpExpiry } });
          try {
            await sendOTPEmail(existingUser.email, otp, existingUser.name);
          } catch (e) {
            console.error('OTP email failed:', e.message);
          }

          // Redirect to OTP verification page with context
          return `/verify-otp?email=${encodeURIComponent(existingUser.email)}&role=${existingUser.role}`;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user._id;
        const isTestAccount = token.email?.endsWith('@sanjeevni.com');
        token.skipOTP = user.skipOTP || isTestAccount;
        token.otpVerified = (user.skipOTP || isTestAccount) ? true : false;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.otpVerified = token.otpVerified || false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  debug: true,
};