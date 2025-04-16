from rust_bindings import ExampleClass


def test_example_class() -> None:
    example = ExampleClass(value=11)
    assert example.value == 11


def test_doc() -> None:
    import rust_bindings

    assert (
        rust_bindings.__doc__ == "An example module implemented in Rust using PyO3."
    )
