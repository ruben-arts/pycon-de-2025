import rust_bindings
import cpp_bindings
import python_bindings


def test() -> None:
    # From the rust bindings we can get some greetings
    submodule_class = rust_bindings.submodule.SubmoduleClass()
    print("rust_binding says: " + submodule_class.greeting())
    print("rust_bindings package worked!")

    # From the CPP bindings we can get some fancy mathematics like add ;)
    print("Add 1 and 2 = " + str(cpp_bindings.add(1,2)))
    print("cpp_bindings package worked!")

    # From the Python bindings we can get a little rich table
    tim = python_bindings.Person("Tim de Jager", 35, "Utrecht")
    print(tim.greet())
    print("python_bindings package worked!")

if __name__ == '__main__':
    test()
