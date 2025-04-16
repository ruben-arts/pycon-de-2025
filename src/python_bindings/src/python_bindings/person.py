from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int
    city: str

    def greet(self) -> str:
        return f"Hi, I'm {self.name} from {self.city}."

    def is_adult(self) -> bool:
        return self.age >= 18
