import React, { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
} from "react-native";

const { width, height } = Dimensions.get("window");

const slides = [
  { id: "1", image: require("../assets/images/img1.jpg") },
  { id: "2", image: require("../assets/images/img2.jpg") },
  { id: "3", image: require("../assets/images/img3.jpg") },
  { id: "4", image: require("../assets/images/img4.jpg") },
];

type OnboardingProps = {
  onFinish?: () => void;
};

export default function Onboarding({ onFinish }: OnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      if (onFinish) onFinish();
      console.log("Get Started pressed!");
    }
  };

  return (
    <View style={styles.container}>
      {/* FlatList for slides */}
      <FlatList
        data={slides}
        renderItem={({ item }) => (
          <Image source={item.image} style={styles.image} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        ref={flatListRef}
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      {/* Next / Get Started Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    width: width,
  height: height * 0.88, // fills more space vertically
  resizeMode: "contain",
  alignSelf: "center",
  },
  pagination: {
    position: "absolute",
    bottom: 80,
    flexDirection: "row",
    alignSelf: "center",
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#888",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: "#fff",
  },
  nextButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  nextButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
