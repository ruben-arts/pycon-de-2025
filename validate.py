import rust_bindings
import cpp_bindings
import python_bindings


def main() -> None:
    # From the rust bindings we can get some greetings
    submodule_class = rust_bindings.submodule.SubmoduleClass()
    assert submodule_class.greeting() == "Hello, world!"
    print("rust_bindings package worked!")

    # From the CPP bindings we can get some fancy mathematics like add ;)
    assert cpp_bindings.add(1,2) == 3
    print("cpp_bindings package worked!")

    # From the Python bindings we can get a little rich table
    tim = python_bindings.Person("Tim de Jager", 35, "Utrecht")
    assert tim.greet() == "Hi, I'm Tim de Jager from Utrecht."
    assert tim.is_adult()
    print("python_bindings package worked!")

if __name__ == '__main__':
    main()
