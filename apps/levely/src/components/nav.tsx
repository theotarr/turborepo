import { Text, TouchableOpacity, View } from "react-native";
import { Link, usePathname } from "expo-router";
import { SymbolView } from "expo-symbols";

const navItems = [
  {
    name: "Home",
    icon: (isActive: boolean) => (
      <SymbolView
        name="house"
        resizeMode="scaleAspectFit"
        size={32}
        weight="medium"
        tintColor={isActive ? "#007AFF" : "#999999"} // Active and inactive colors
      />
    ),
    href: "/dashboard",
  },
  {
    name: "Daily",
    icon: (isActive: boolean) => (
      <SymbolView
        name="calendar"
        resizeMode="scaleAspectFit"
        size={32}
        weight="medium"
        tintColor={isActive ? "#007AFF" : "#999999"} // Active and inactive colors
      />
    ),
    href: "/daily",
  },
  {
    name: "Retake test",
    icon: (isActive: boolean) => (
      <SymbolView
        name="arrow.2.squarepath"
        resizeMode="scaleAspectFit"
        size={32}
        weight="medium"
        tintColor={isActive ? "#007AFF" : "#999999"} // Active and inactive colors
      />
    ),
    href: "/retake",
  },
  {
    name: "Account",
    icon: (isActive: boolean) => (
      <SymbolView
        name="person.crop.circle"
        resizeMode="scaleAspectFit"
        size={32}
        weight="medium"
        tintColor={isActive ? "#007AFF" : "#999999"} // Active and inactive colors
      />
    ),
    href: "/account",
  },
];

export const NavigationBar = () => {
  const pathname = usePathname();

  return (
    <View className="mb-8 flex-row items-center justify-around border-t border-black/30 bg-background py-2.5">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link href={item.href} asChild key={item.name}>
            <TouchableOpacity
              className="items-center justify-center px-3"
              activeOpacity={0.7}
            >
              {item.icon(isActive)}
              <Text
                className={`mt-1 text-xs font-medium ${
                  isActive ? "text-primary" : "text-[#999999]"
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          </Link>
        );
      })}
    </View>
  );
};